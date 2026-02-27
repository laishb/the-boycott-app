---
name: fetch-prices
description: Fetch product prices from Israeli government-mandated supermarket price data. Downloads PriceFull XML files from 4 major chains (Shufersal, Rami Levy, Victory, Yeinot Bitan), filters by multi-supplier presence and packaging type, deduplicates by barcode, and either updates mockData.js for local dev or seeds Firestore for production.
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
argument-hint: "mock|firestore|both [limit]"
---

# Fetch Prices from Israeli Government Data

Downloads product prices from Israeli supermarket chains using the `il-supermarket-scraper` and `il-supermarket-parser` Python libraries. These libraries access government-mandated price transparency data (Israeli Food Law 2014).

## Features

✓ **4 Major Chains**: Shufersal, Rami Levy, Victory, Yeinot Bitan
✓ **Multi-Supplier Filtering**: Only products on ≥2 chains
✓ **Smart Filtering**: Excludes products with "משקל" or "במשקל" (by weight, requires scale)
✓ **Configurable Settings**: Min price, min suppliers, allowed categories via Firestore config
✓ **Two Targets**: Update mockData.js (dev) or seed Firestore (production)

## Arguments

- `$0` — **target**: `mock` (default) to update `src/data/mockData.js`, `firestore` to seed Firestore, or `both`
- `$1` — **num_products**: max products to include (default: 50; for future use)

## Quick Start

Run the wrapper script:

```bash
cd .claude/skills/fetch-prices
bash fetch-prices.sh mock          # Update mockData.js (local dev)
bash fetch-prices.sh firestore     # Seed Firestore (production)
bash fetch-prices.sh both          # Both
```

The script auto-creates the Python venv and installs dependencies if needed.

## Configuration

Settings are stored in Firestore at `config/importSettings`:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the import job |
| `minPrice` | number | `3.0` | Skip items below ₪3 (NIS) |
| `minSuppliers` | integer | `2` | Only include products on ≥N chains |
| `allowedCategories` | string[] | `[]` | If non-empty, whitelist these categories only |

Example Firestore config:
```json
{
  "enabled": true,
  "minPrice": 3.0,
  "minSuppliers": 2,
  "allowedCategories": []
}
```

## Chains

| ID | Name | Protocol | Market Share |
|----|------|----------|--------------|
| SHUFERSAL | Shufersal | HTTPS | ~30% |
| RAMI_LEVY | Rami Levy | FTP | ~10% (blocked outside IL) |
| VICTORY | Victory | HTTPS | Discount |
| YAYNO_BITAN | Yeinot Bitan | HTTPS | ~15% |

**Note:** FTP-based chains (Rami Levy) only work from Israeli IPs. HTTPS chains (Shufersal, Victory, Yeinot Bitan) work globally.

## Filtering Logic

Products are filtered at 5 stages:

### 1. Individual Product Validation
- ItemCode (barcode) must exist
- ItemName must exist
- ItemPrice must be > 0 and convertible to float

### 2. Weight-Based Exclusion
- Remove if name contains `"משקל"` or `"במשקל"` (by weight, e.g., "חזה אווז במשקל" or "גבינה משקל")
- These require store scale weighing, not fixed packaging — prices vary by actual weight
- Example: "כתף בקר מעושן משקל" → filtered out

### 3. Chain Name Cleanup
- Removes chain names embedded in product names from source data (e.g., "נתחי סלמון טרי שופרסל" → "נתחי סלמון טרי")
- Prevents duplicate product entries caused by variant naming across chains
- Applied when selecting the most common name during deduplication

### 4. Multi-Supplier Filtering
- Products must appear on **at least `minSuppliers`** different chains (default: 2)
- Ensures price comparison validity
- Example: product in only Shufersal → filtered out; product in Shufersal + Rami Levy → kept

### 5. Price Threshold
- Products below `minPrice` (default: ₪3) are excluded

**Example:**
```
Raw records: 10,000
After step 2 (weight): 8,500
After step 3 (chain name cleanup): 8,500
After step 4 (2+ suppliers): 2,200
After step 5 (min price): 2,000
Final products: 2,000 ✓
```

## Output Schema

### mockData.js
- First N products → `MOCK_BOYCOTTED_PRODUCTS` (status: boycotted, vote counts baked in)
- Remaining → `MOCK_ACTIVE_PRODUCTS` (status: active, 0 votes)
- Includes in-memory vote/like store functions

### Firestore (`products` collection)
```
products/{productId}
├── name: string (Hebrew, e.g., "טיים רד פאקט")
├── barcode: string (ItemCode)
├── priceRange: string ("₪X–Y" e.g., "₪100–150")
├── status: "active" | "boycotted" | "archived"
├── currentWeekVotes: number
├── totalHistoricalVotes: number
├── weeklyLikes: number
├── isPreviousBoycott: boolean
├── previousBoycottWeeks: string[]
├── suppliers: string[]  ← NEW: list of chains (e.g., ["Shufersal", "Rami Levy"])
├── category: string (ManufacturerName)
├── importSource: "government-price-data" | "seed-script"
├── lastImportedAt: timestamp
├── createdAt: timestamp
├── lastModified: timestamp
```

## Execution Steps (Reference)

### Step 1: Download Price Data

Run `scripts/fetch_rami_levy.py` or Cloud Run Job `functions/import-products/main.py`:

```bash
# Local dev
python scripts/fetch_rami_levy.py

# Cloud Run Job
docker build -t gcr.io/the-boycott-app/import-products .
gcloud run jobs execute import-products --region me-west1
```

Uses `il_supermarket_scarper.ScarpingTask` with params:
- `dump_folder_name` (NOT `dump_folder`)
- `files_types=["PRICE_FULL_FILE"]`
- `enabled_scrapers=["SHUFERSAL", "RAMI_LEVY", "VICTORY", "YAYNO_BITAN"]` (strings, NOT enums)
- `limit=1` (1 file per chain)

### Step 2: Parse XML to CSV

Uses `il_supermarket_parsers.ConvertingTask`:
```python
task = ConvertingTask(data_folder=DUMP_DIR, output_folder=OUTPUT_DIR)
task.run()
```

Output: CSV files in `OUTPUT_DIR/{chain}/{store}/prices.csv` with columns:
- `ItemCode` → barcode
- `ItemName` → product name (Hebrew)
- `ItemPrice` → price (float)
- `ManufacturerName` → category

### Step 3: Filter & Deduplicate

Apply 5-stage filtering (see above), then:
- Collect all prices per barcode → compute min/max
- Remove chain names from each product name (e.g., "שופרסל" → removed)
- Most common cleaned name wins (for duplicates)
- Most common category wins
- Track which suppliers have this product

### Step 4: Output

**If target = `mock`:**
- Generate `src/data/mockData.js` with 50 products (5 boycotted, 45 active)
- Remind user: `npm run dev`

**If target = `firestore`:**
- Seed Firestore `products` collection with all filtered products

**If target = `both`:**
- Generate both mock and firestore

### Step 5: Cleanup

Remove temporary directories: `.tmp_dumps/`, `.tmp_output/`

## Important Notes

- Hebrew text may cause encoding issues on Windows consoles (cp1252). Write to files instead of printing.
- FTP-based chains only work from Israeli IPs (Rami Levy blocked outside IL).
- Downloads can take 1-3 minutes per chain (large XML files).
- Package typo: `il_supermarket_scarper` (not scraper).
- Parser package: `il_supermarket_parsers`.
- Cloud Run Job runs weekly Sunday 22:00 UTC (before Monday 00:00 weekly reset).
- Min suppliers default is 2 — products on only 1 chain are filtered out to ensure price comparison validity.
