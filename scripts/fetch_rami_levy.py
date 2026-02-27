"""
Quick script: download Rami Levy products, parse them,
and output a JS mock data file for the dev site.

Usage: python scripts/fetch_rami_levy.py
"""

import csv
import json
import os
import shutil
import sys
from collections import Counter
from pathlib import Path

DUMP_DIR = os.path.join(os.path.dirname(__file__), "..", ".tmp_dumps")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", ".tmp_output")
MAX_PRODUCTS = 50  # limit for mock data


def main():
    print("Step 1/3: Downloading Rami Levy price data...")
    download()

    print("Step 2/3: Parsing XML files...")
    parse()

    print("Step 3/3: Generating mock data...")
    products = read_and_dedupe()

    if not products:
        print("ERROR: No products found. The scraper may have failed.")
        print("Check if you're in Israel — some chains block non-IL IPs.")
        sys.exit(1)

    generate_mock_js(products)
    print(f"Done! Generated {len(products)} products.")
    print("Restart dev server (npm run dev) to see them.")

    # Cleanup
    for d in (DUMP_DIR, OUTPUT_DIR):
        if os.path.exists(d):
            shutil.rmtree(d)


def download():
    from il_supermarket_scarper import ScarpingTask

    for d in (DUMP_DIR, OUTPUT_DIR):
        if os.path.exists(d):
            shutil.rmtree(d)
        os.makedirs(d, exist_ok=True)

    # Download from all 4 major Israeli supermarket chains
    chains = ["SHUFERSAL", "RAMI_LEVY", "VICTORY", "YAYNO_BITAN"]

    for chain in chains:
        try:
            print(f"\nDownloading from {chain}...")
            task = ScarpingTask(
                dump_folder_name=DUMP_DIR,
                files_types=["PRICE_FULL_FILE"],
                enabled_scrapers=[chain],
                limit=1,
            )
            task.start()
            print(f"[OK] {chain} downloaded")
        except Exception as e:
            print(f"[SKIP] {chain} failed: {e}")
            # Continue with next chain on failure


def parse():
    from il_supermarket_parsers import ConvertingTask

    task = ConvertingTask(
        data_folder=DUMP_DIR,
        output_folder=OUTPUT_DIR,
    )
    task.run()


def read_and_dedupe():
    records = []
    for csv_file in Path(OUTPUT_DIR).rglob("*.csv"):
        try:
            with open(csv_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    code = row.get("ItemCode", "").strip()
                    name = row.get("ItemName", "").strip()
                    price = row.get("ItemPrice", "").strip()
                    if not code or not name or not price:
                        continue
                    try:
                        p = float(price)
                    except ValueError:
                        continue
                    if p <= 0:
                        continue
                    records.append({"barcode": code, "name": name, "price": p})
        except Exception as e:
            print(f"  Warning: failed to read {csv_file}: {e}")

    # Deduplicate by barcode
    buckets = {}
    for r in records:
        bc = r["barcode"]
        if bc not in buckets:
            buckets[bc] = {"names": [], "prices": []}
        buckets[bc]["names"].append(r["name"])
        buckets[bc]["prices"].append(r["price"])

    products = []
    for bc, data in buckets.items():
        name = Counter(data["names"]).most_common(1)[0][0]
        min_p = min(data["prices"])
        max_p = max(data["prices"])
        price_range = f"₪{min_p:.0f}" if min_p == max_p else f"₪{min_p:.0f}–{max_p:.0f}"
        products.append({"barcode": bc, "name": name, "priceRange": price_range, "avgPrice": (min_p + max_p) / 2})

    # Sort by average price descending, take top N
    products.sort(key=lambda p: p["avgPrice"], reverse=True)
    return products[:MAX_PRODUCTS]


def generate_mock_js(products):
    """Generate mockData.js with real Rami Levy products."""
    boycotted = products[:5]
    active = products[5:]

    lines = [
        "import { PRODUCT_STATUS } from '../utils/constants.js'",
        "",
        "// Auto-generated from Rami Levy government price data.",
        "// In production: auto-imported from government price data (Cloud Run Job).",
        "",
        "// Current week's boycott list (5 products)",
        "export const MOCK_BOYCOTTED_PRODUCTS = [",
    ]

    for i, p in enumerate(boycotted):
        votes = 900 - i * 100
        likes = votes + 200
        lines.append("  {")
        lines.append(f"    productId: 'prod-{i+1:03d}',")
        lines.append(f"    name: {json.dumps(p['name'], ensure_ascii=False)},")
        lines.append(f"    barcode: {json.dumps(p['barcode'])},")
        lines.append(f"    priceRange: {json.dumps(p['priceRange'], ensure_ascii=False)},")
        lines.append(f"    currentWeekVotes: {votes},")
        lines.append(f"    weeklyLikes: {likes},")
        lines.append(f"    totalHistoricalVotes: {votes * 3},")
        lines.append(f"    isPreviousBoycott: {'true' if i % 2 == 0 else 'false'},")
        lines.append(f"    previousBoycottWeeks: {json.dumps(['2026-W07'] if i % 2 == 0 else [])},")
        lines.append(f"    status: PRODUCT_STATUS.BOYCOTTED,")
        lines.append(f"    createdAt: new Date('2026-02-01'),")
        lines.append(f"    lastModified: new Date('2026-02-24'),")
        lines.append("  },")

    lines.append("]")
    lines.append("")
    lines.append("// Active products — candidates for next week's boycott list")
    lines.append("export const MOCK_ACTIVE_PRODUCTS = [")

    for i, p in enumerate(active):
        votes = max(600 - i * 30, 0)
        lines.append("  {")
        lines.append(f"    productId: 'prod-{i+6:03d}',")
        lines.append(f"    name: {json.dumps(p['name'], ensure_ascii=False)},")
        lines.append(f"    barcode: {json.dumps(p['barcode'])},")
        lines.append(f"    priceRange: {json.dumps(p['priceRange'], ensure_ascii=False)},")
        lines.append(f"    currentWeekVotes: {votes},")
        lines.append(f"    totalHistoricalVotes: {votes},")
        lines.append(f"    isPreviousBoycott: false,")
        lines.append(f"    previousBoycottWeeks: [],")
        lines.append(f"    status: PRODUCT_STATUS.ACTIVE,")
        lines.append(f"    createdAt: new Date('2026-02-15'),")
        lines.append(f"    lastModified: new Date('2026-02-24'),")
        lines.append("  },")

    lines.append("]")
    lines.append("")

    # Append the in-memory vote/like store code from existing file
    lines.extend([
        "// ─── In-memory vote store (mock mode) ─────────────────────────────────────────",
        "",
        "let mockVotes = []",
        "",
        "export function getMockVotes() {",
        "  return mockVotes",
        "}",
        "",
        "export function addMockVote(vote) {",
        "  mockVotes.push(vote)",
        "}",
        "",
        "export function resetMockVotes() {",
        "  mockVotes = []",
        "}",
        "",
        "// Mutable vote counts per product",
        "let productVoteCounts = Object.fromEntries(",
        "  [...MOCK_BOYCOTTED_PRODUCTS, ...MOCK_ACTIVE_PRODUCTS].map(p => [p.productId, p.currentWeekVotes])",
        ")",
        "",
        "export function getMockVoteCount(productId) {",
        "  return productVoteCounts[productId] ?? 0",
        "}",
        "",
        "export function incrementMockVoteCounts(productIds) {",
        "  productIds.forEach(id => {",
        "    if (id in productVoteCounts) {",
        "      productVoteCounts[id] += 1",
        "    }",
        "  })",
        "}",
        "",
        "// ─── In-memory like store (mock mode) ─────────────────────────────────────────",
        "",
        "let mockLikes = []",
        "",
        "export function getMockLikes() {",
        "  return mockLikes",
        "}",
        "",
        "export function addMockLike(like) {",
        "  mockLikes.push(like)",
        "}",
        "",
        "export function resetMockLikes() {",
        "  mockLikes = []",
        "}",
        "",
        "export function hasUserLikedProduct(uid, productId, weekId) {",
        "  return mockLikes.some(l => l.userId === uid && l.productId === productId && l.weekId === weekId)",
        "}",
        "",
        "// Mutable like counts per boycotted product",
        "let productLikeCounts = Object.fromEntries(",
        "  MOCK_BOYCOTTED_PRODUCTS.map(p => [p.productId, p.weeklyLikes ?? 0])",
        ")",
        "",
        "export function getMockLikeCount(productId) {",
        "  return productLikeCounts[productId] ?? 0",
        "}",
        "",
        "export function incrementMockLikeCount(productId) {",
        "  if (productId in productLikeCounts) {",
        "    productLikeCounts[productId] += 1",
        "  }",
        "}",
        "",
    ])

    output_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "mockData.js")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"  Written to {output_path}")


if __name__ == "__main__":
    main()
