"""
Product Import Job — Entry Point

Orchestrates:
1. Load config from Firestore
2. Download PriceFull XMLs from configured chains (Shufersal, Rami Levy, Victory)
3. Parse and deduplicate by barcode
4. Upsert to Firestore products collection
5. Archive stale products
6. Update run status

Designed to run as a Google Cloud Run Job, triggered by Cloud Scheduler
every Sunday at 22:00 UTC (before Monday 00:00 weekly reset).
"""

import logging
import sys

from chains import CHAINS
from config import get_firestore_client, load_import_settings, update_run_status
from parser import download_chain_data, parse_downloaded_data, deduplicate_products
from firestore_sync import sync_products

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("import-products")


def main():
    logger.info("Starting product import job")

    # 1. Connect to Firestore and load settings
    db = get_firestore_client()
    settings = load_import_settings(db)

    if not settings.get("enabled", True):
        logger.info("Import is disabled in config. Exiting.")
        update_run_status(db, "skipped")
        return

    min_price = settings.get("minPrice", 3.0)
    min_suppliers = settings.get("minSuppliers", 2)
    allowed_categories = settings.get("allowedCategories", [])

    # 2. Download data from configured chains
    chain_ids = [c["id"] for c in CHAINS]
    chain_names = [c["name"] for c in CHAINS]
    logger.info("Downloading data from chains: %s", ", ".join(chain_names))

    data_folder = download_chain_data(chain_ids)

    # 3. Parse downloaded XMLs
    logger.info("Parsing downloaded data...")
    records = parse_downloaded_data(data_folder)

    if not records:
        logger.warning("No product records parsed. Check chain downloads.")
        update_run_status(db, "failed", 0)
        sys.exit(1)

    # 4. Deduplicate by barcode (only products on 2+ suppliers, exclude weight-based items)
    chain_names = [c["name"] for c in CHAINS]
    products = deduplicate_products(records, min_price=min_price, min_suppliers=min_suppliers, chain_names=chain_names)
    logger.info("Deduplicated to %d unique products", len(products))

    # 5. Sync to Firestore
    counts = sync_products(db, products, allowed_categories=allowed_categories)

    # 6. Update run status
    total = counts["created"] + counts["updated"]
    update_run_status(db, "success", total)

    logger.info(
        "Import complete. Created=%d, Updated=%d, Archived=%d. "
        "Chains processed: %s",
        counts["created"],
        counts["updated"],
        counts["archived"],
        ", ".join(chain_names),
    )


if __name__ == "__main__":
    try:
        main()
    except Exception:
        logger.exception("Product import job failed")
        sys.exit(1)
