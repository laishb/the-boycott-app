# Fetch Prices — Reference

## Project Files

| File | Purpose |
|------|---------|
| `scripts/fetch_rami_levy.py` | Local script: download → parse → generate mockData.js |
| `scripts/seed-firestore.mjs` | Seed Firestore with product data (Node.js, client SDK) |
| `functions/import-products/main.py` | Cloud Run Job entry point |
| `functions/import-products/parser.py` | Download + parse + deduplicate + filter logic |
| `functions/import-products/firestore_sync.py` | Upsert/archive logic for Firestore |
| `functions/import-products/chains.py` | Chain IDs: SHUFERSAL, RAMI_LEVY, VICTORY, YAYNO_BITAN |
| `functions/import-products/config.py` | Firestore config reader + run status updater |
| `functions/import-products/Dockerfile` | Docker image for Cloud Run Job |

## Python Libraries

### il-supermarket-scraper (note: package name has typo "scarper")

```python
from il_supermarket_scarper import ScarpingTask

task = ScarpingTask(
    dump_folder_name="/tmp/dumps",      # NOT dump_folder
    files_types=["PRICE_FULL_FILE"],    # NOT "PriceFull"
    enabled_scrapers=["SHUFERSAL"],     # strings, NOT enum values
    limit=1,                            # number of files per chain
)
task.start()
```

Available file types: `PRICE_FULL_FILE`, `PRICE_UPDATE_FILE`, `PROMO_FULL_FILE`, `STORES_FILE`

### il-supermarket-parser

```python
from il_supermarket_parsers import ConvertingTask

task = ConvertingTask(
    data_folder="/tmp/dumps",
    output_folder="/tmp/output",
)
task.run()
```

Output: CSV files with columns `ItemCode, ItemName, ItemPrice, ManufacturerName, ...`

## Chain Details (4 Suppliers)

| Chain | Scraper ID | Protocol | Market Share | Works Global? |
|-------|-----------|----------|--------------|---------------|
| Shufersal | `SHUFERSAL` | HTTPS | ~30% | ✓ Yes |
| Rami Levy | `RAMI_LEVY` | FTP | ~10% | ✗ Israeli IPs only |
| Victory | `VICTORY` | HTTPS | Discount | ✓ Yes |
| Yeinot Bitan | `YAYNO_BITAN` | HTTPS | ~15% | ✓ Yes |

## Filtering Strategy

**Stage 1: Individual Validation**
- ItemCode, ItemName, ItemPrice must exist and be valid
- Price > 0

**Stage 2: Weight-Based Exclusion**
- Remove if name contains `"משקל"` or `"במשקל"` (by weight, requires store scale)
- Price is per actual weight, not fixed packaging — invalid for boycott tracking
- Example exclude: "חזה אווז במשקל", "סטייק משקל", "גבינה משקל"

**Stage 3: Multi-Supplier Requirement**
- Product must appear on ≥ `minSuppliers` chains (default: 2)
- Ensures valid price comparison across vendors
- Reduces data noise (products unique to 1 chain are usually niche items)

**Stage 4: Price Threshold**
- Skip if max observed price < `minPrice` (default: ₪3)

**Result:** From 10,000+ raw records → 2,000 high-quality, multi-vendor products

## Firestore Schema (products collection)

```
products/{productId}
├── name: string (Hebrew)
├── barcode: string (ItemCode)
├── priceRange: string ("₪X–Y")
├── status: "active" | "boycotted" | "archived"
├── currentWeekVotes: number
├── totalHistoricalVotes: number
├── weeklyLikes: number
├── isPreviousBoycott: boolean
├── previousBoycottWeeks: string[]
├── category: string (ManufacturerName)
├── importSource: string ("government-price-data" | "seed-script")
├── lastImportedAt: timestamp
├── createdAt: timestamp
├── lastModified: timestamp
```

## Sync Logic (firestore_sync.py)

- **New product** (barcode not in Firestore): CREATE with `status: "active"`, votes at 0
- **Existing product** (matching barcode): UPDATE only `name, priceRange, lastImportedAt` — never touch vote/status fields
- **Stale product** (not seen in 4+ weeks, `status: "active"`, `importSource: "government-price-data"`): set `status: "archived"`
- **Never archive** products with `status: "boycotted"`
- Uses Firestore batched writes (max 500 per batch)

## Firebase Config

```
Project: the-boycott-app
Region: me-west1 (Tel Aviv)
Hosting: https://the-boycott-app.web.app
```
