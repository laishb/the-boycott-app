"""
Firestore sync logic for the product import job.

Handles:
- Creating new products (status="active", vote fields zeroed)
- Updating existing products (refresh name, priceRange, lastImportedAt)
- Archiving stale products (not seen in 4+ weeks, active, auto-imported)

Never touches voting state (currentWeekVotes, isPreviousBoycott, etc.)
Never archives products with status="boycotted".
"""

import logging
from datetime import datetime, timedelta, timezone

from google.cloud.firestore import SERVER_TIMESTAMP

logger = logging.getLogger(__name__)

PRODUCTS_COLLECTION = "products"
BATCH_SIZE = 500
STALE_THRESHOLD_WEEKS = 4
IMPORT_SOURCE = "government-price-data"


def sync_products(db, products, allowed_categories=None):
    """
    Upsert products into Firestore.

    Args:
        db: Firestore client
        products: dict keyed by barcode, from parser.deduplicate_products()
        allowed_categories: list of category strings to filter by (empty = all)

    Returns:
        dict with counts: {"created": int, "updated": int, "archived": int}
    """
    counts = {"created": 0, "updated": 0, "archived": 0}

    # Filter by allowed categories if configured
    if allowed_categories:
        cat_set = {c.lower() for c in allowed_categories}
        products = {
            bc: p
            for bc, p in products.items()
            if p.get("category", "").lower() in cat_set
        }
        logger.info(
            "Filtered to %d products matching allowed categories", len(products)
        )

    # Load existing products indexed by barcode
    existing = _load_existing_products(db)

    # Upsert in batches
    seen_barcodes = set()
    batch = db.batch()
    batch_count = 0

    for barcode, product_data in products.items():
        seen_barcodes.add(barcode)

        if barcode in existing:
            # UPDATE existing product — only refresh metadata
            doc_ref = existing[barcode]["ref"]
            batch.update(
                doc_ref,
                {
                    "name": product_data["name"],
                    "priceRange": product_data["priceRange"],
                    "category": product_data.get("category", ""),
                    "lastImportedAt": SERVER_TIMESTAMP,
                },
            )
            counts["updated"] += 1
        else:
            # CREATE new product
            doc_ref = db.collection(PRODUCTS_COLLECTION).document()
            batch.set(
                doc_ref,
                {
                    "productId": doc_ref.id,
                    "barcode": barcode,
                    "name": product_data["name"],
                    "priceRange": product_data["priceRange"],
                    "category": product_data.get("category", ""),
                    "currentWeekVotes": 0,
                    "totalHistoricalVotes": 0,
                    "isPreviousBoycott": False,
                    "previousBoycottWeeks": [],
                    "status": "active",
                    "importSource": IMPORT_SOURCE,
                    "lastImportedAt": SERVER_TIMESTAMP,
                    "createdAt": SERVER_TIMESTAMP,
                },
            )
            counts["created"] += 1

        batch_count += 1
        if batch_count >= BATCH_SIZE:
            batch.commit()
            batch = db.batch()
            batch_count = 0

    # Commit remaining
    if batch_count > 0:
        batch.commit()

    logger.info(
        "Upserted products: %d created, %d updated", counts["created"], counts["updated"]
    )

    # Archive stale products
    counts["archived"] = _archive_stale_products(db, existing, seen_barcodes)

    return counts


def _load_existing_products(db):
    """
    Load all products with importSource="government-price-data",
    indexed by barcode for O(1) lookup.
    """
    existing = {}
    query = (
        db.collection(PRODUCTS_COLLECTION)
        .where("importSource", "==", IMPORT_SOURCE)
    )

    for doc in query.stream():
        data = doc.to_dict()
        barcode = data.get("barcode")
        if barcode:
            existing[barcode] = {"ref": doc.reference, "data": data}

    logger.info("Loaded %d existing imported products from Firestore", len(existing))
    return existing


def _archive_stale_products(db, existing, seen_barcodes):
    """
    Archive products that:
    - Were imported by us (importSource = government-price-data)
    - Were NOT seen in the current import
    - Have status = "active" (never archive "boycotted")
    - Have lastImportedAt older than STALE_THRESHOLD_WEEKS
    """
    cutoff = datetime.now(timezone.utc) - timedelta(weeks=STALE_THRESHOLD_WEEKS)
    archived = 0
    batch = db.batch()
    batch_count = 0

    for barcode, entry in existing.items():
        if barcode in seen_barcodes:
            continue

        data = entry["data"]
        if data.get("status") != "active":
            continue

        last_imported = data.get("lastImportedAt")
        if last_imported and last_imported.replace(tzinfo=timezone.utc) > cutoff:
            continue

        batch.update(entry["ref"], {"status": "archived"})
        archived += 1
        batch_count += 1

        if batch_count >= BATCH_SIZE:
            batch.commit()
            batch = db.batch()
            batch_count = 0

    if batch_count > 0:
        batch.commit()

    if archived > 0:
        logger.info("Archived %d stale products", archived)

    return archived
