"""
Downloads and parses PriceFull XML files from Israeli supermarket chains
using il-supermarket-scraper and il-supermarket-parser.

Outputs a deduplicated dict keyed by barcode:
{
    barcode: {
        "name": str,
        "prices": [float, ...],
        "category": str,
    }
}
"""

import logging
import os
import shutil
import time
from pathlib import Path

logger = logging.getLogger(__name__)


def clean_product_name(name, chain_names):
    """
    Remove chain names from product name to avoid duplication from source data.

    Example:
        "נתחי סלמון טרי שופרסל" + ["Shufersal"] → "נתחי סלמון טרי"

    Args:
        name: Product name (may contain chain name from source data)
        chain_names: List of chain names to remove

    Returns:
        Cleaned product name
    """
    cleaned = name
    for chain in chain_names:
        # Remove chain name in various positions: " ChainName", "ChainName ", " ChainName "
        cleaned = cleaned.replace(f" {chain}", "").replace(f"{chain} ", "")
    return cleaned.strip()

DATA_FOLDER = "/tmp/supermarket_dumps"
OUTPUT_FOLDER = "/tmp/supermarket_output"

# Delay between chain downloads to avoid rate limiting (seconds)
CHAIN_DELAY_S = 2


def download_chain_data(chain_ids):
    """
    Download PriceFull files for the given chain IDs.
    Uses il-supermarket-scraper to fetch XML data from each chain.

    Returns the path to the data folder.
    """
    from il_supermarket_scarper import ScarpingTask
    from il_supermarket_scarper.scrappers_factory import ScraperFactory

    # Clean previous run data
    for folder in (DATA_FOLDER, OUTPUT_FOLDER):
        if os.path.exists(folder):
            shutil.rmtree(folder)
        os.makedirs(folder, exist_ok=True)

    enabled_scrapers = []
    for chain_id in chain_ids:
        try:
            scraper_enum = ScraperFactory[chain_id]
            enabled_scrapers.append(scraper_enum)
            logger.info("Enabled scraper: %s", chain_id)
        except KeyError:
            logger.error("Unknown chain ID: %s — skipping", chain_id)

    if not enabled_scrapers:
        logger.error("No valid scrapers found. Aborting download.")
        return DATA_FOLDER

    for i, scraper_enum in enumerate(enabled_scrapers):
        try:
            logger.info("Downloading data for %s...", scraper_enum.name)
            task = ScarpingTask(
                dump_folder_name=DATA_FOLDER,
                files_types=["PRICE_FULL_FILE"],
                enabled_scrapers=[scraper_enum],
                limit=1,
            )
            task.start()
            logger.info("Completed download for %s", scraper_enum.name)
        except Exception:
            logger.exception("Failed to download %s — continuing with others", scraper_enum.name)

        if i < len(enabled_scrapers) - 1:
            time.sleep(CHAIN_DELAY_S)

    return DATA_FOLDER


def parse_downloaded_data(data_folder):
    """
    Parse the downloaded XML files into structured product data.
    Uses il-supermarket-parser to convert XMLs into a unified format.

    Returns a list of dicts with keys: ItemCode, ItemName, ItemPrice,
    ManufacturerName, etc.
    """
    from il_supermarket_parsers import ConvertingTask

    try:
        task = ConvertingTask(
            data_folder=data_folder,
            output_folder=OUTPUT_FOLDER,
        )
        task.run()
    except Exception:
        logger.exception("Failed to parse downloaded data")
        return []

    # Read all parsed CSV/JSON output files
    return _read_parsed_output(OUTPUT_FOLDER)


def _read_parsed_output(output_folder, chain_names_map=None):
    """
    Read parsed output files and return a flat list of product records.
    The parser outputs CSV files with columns like:
    ItemCode, ItemName, ItemPrice, ManufacturerName, etc.

    Also tracks which chain/supplier each product came from by examining
    the folder structure.

    Args:
        output_folder: path to parsed output
        chain_names_map: dict mapping chain_id to chain_name (for tracking)
    """
    import csv

    if chain_names_map is None:
        chain_names_map = {}

    records = []
    output_path = Path(output_folder)

    for csv_file in output_path.rglob("*.csv"):
        try:
            # Infer chain/supplier from file path (usually chain/store/prices.csv)
            # Use folder structure to identify which chain this came from
            rel_path = csv_file.relative_to(output_path)
            chain_folder = rel_path.parts[0] if rel_path.parts else "unknown"

            # Try to map folder name to a friendly chain name
            supplier_name = chain_names_map.get(chain_folder, chain_folder.replace("_", " ").title())

            with open(csv_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Skip rows without essential fields
                    item_code = row.get("ItemCode", "").strip()
                    item_name = row.get("ItemName", "").strip()
                    item_price = row.get("ItemPrice", "").strip()

                    if not item_code or not item_name or not item_price:
                        continue

                    try:
                        price = float(item_price)
                    except (ValueError, TypeError):
                        continue

                    if price <= 0:
                        continue

                    records.append(
                        {
                            "barcode": item_code,
                            "name": item_name,
                            "price": price,
                            "category": row.get("ManufacturerName", "").strip(),
                            "supplier": supplier_name,
                        }
                    )
        except Exception:
            logger.exception("Failed to read %s — skipping", csv_file)

    logger.info("Parsed %d product records from output files", len(records))
    return records


def deduplicate_products(records, min_price=0.0, min_suppliers=2, chain_names=None):
    """
    Deduplicate product records by barcode with multi-supplier filtering.

    For each barcode:
    - Collect all observed prices → compute min/max for priceRange
    - Use the most common name across records (after cleaning chain names)
    - Use the most common category
    - Track which suppliers (chains) have this product
    - Filter to products appearing in at least min_suppliers chains
    - Remove products with 'במשקל' (by weight) in name

    Args:
        records: List of product records from parser
        min_price: Minimum price threshold (default: 0.0)
        min_suppliers: Minimum number of chains a product must appear in (default: 2)
        chain_names: List of chain names to remove from product names (default: None)

    Returns dict keyed by barcode:
    {
        barcode: {
            "name": str,
            "priceRange": "₪X–Y",
            "category": str,
            "suppliers": [str, ...],  # list of chain names
        }
    }
    """
    from collections import Counter

    if chain_names is None:
        chain_names = []

    buckets = {}

    for rec in records:
        barcode = rec["barcode"]
        if barcode not in buckets:
            buckets[barcode] = {"names": [], "prices": [], "categories": [], "suppliers": set()}

        buckets[barcode]["names"].append(rec["name"])
        buckets[barcode]["prices"].append(rec["price"])
        if rec.get("category"):
            buckets[barcode]["categories"].append(rec["category"])
        if rec.get("supplier"):
            buckets[barcode]["suppliers"].add(rec["supplier"])

    products = {}
    filtered_out = {"price": 0, "weight": 0, "suppliers": 0}

    for barcode, data in buckets.items():
        prices = data["prices"]
        min_p = min(prices)
        max_p = max(prices)

        # Skip products below minimum price threshold
        if max_p < min_price:
            filtered_out["price"] += 1
            continue

        # Most common name (after cleaning chain names from source data)
        cleaned_names = [clean_product_name(n, chain_names) for n in data["names"]]
        name = Counter(cleaned_names).most_common(1)[0][0]

        # Skip products marked 'במשקל' (by weight, requires scale)
        if "במשקל" in name:
            filtered_out["weight"] += 1
            continue

        # Skip products not in enough suppliers
        if len(data["suppliers"]) < min_suppliers:
            filtered_out["suppliers"] += 1
            continue

        # Most common category (or empty string)
        category = ""
        if data["categories"]:
            category = Counter(data["categories"]).most_common(1)[0][0]

        # Format price range
        if min_p == max_p:
            price_range = f"₪{min_p:.0f}"
        else:
            price_range = f"₪{min_p:.0f}–{max_p:.0f}"

        products[barcode] = {
            "name": name,
            "priceRange": price_range,
            "category": category,
            "suppliers": sorted(list(data["suppliers"])),
        }

    logger.info(
        "Deduplicated %d records into %d unique products "
        "(min_price=%.1f, min_suppliers=%d). "
        "Filtered out: %d by price, %d by weight, %d by supplier count",
        len(records),
        len(products),
        min_price,
        min_suppliers,
        filtered_out["price"],
        filtered_out["weight"],
        filtered_out["suppliers"],
    )
    return products
