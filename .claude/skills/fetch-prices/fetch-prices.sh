#!/bin/bash
# Unified price-fetching wrapper for the skill
# Usage: ./fetch-prices.sh [target] [chain] [limit]
# target: mock (default), firestore, both
# chain: shufersal (default), rami_levy, victory, all
# limit: max products (default: 50)

set -e

TARGET="${1:-mock}"
CHAIN="${2:-shufersal}"
LIMIT="${3:-50}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

echo "=== Fetch Prices from Israeli Government Data ==="
echo "Target:  $TARGET"
echo "Chain:   $CHAIN"
echo "Limit:   $LIMIT"
echo

# Ensure venv and dependencies
cd "$PROJECT_ROOT"
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python -m venv .venv
fi

source .venv/Scripts/activate 2>/dev/null || source .venv/bin/activate
echo "Installing dependencies..."
pip install -q il-supermarket-scraper il-supermarket-parser google-cloud-firestore 2>&1 | grep -v "already satisfied" || true

if [ "$TARGET" = "mock" ] || [ "$TARGET" = "both" ]; then
    echo
    echo "━━━ STEP 1: Downloading $CHAIN price data ━━━"
    python scripts/fetch_rami_levy.py
    echo "✓ Mock data generated: src/data/mockData.js"
    echo "  Next: npm run dev"
fi

if [ "$TARGET" = "firestore" ] || [ "$TARGET" = "both" ]; then
    echo
    echo "━━━ STEP 2: Seeding Firestore ━━━"
    if command -v node &> /dev/null; then
        node scripts/seed-firestore.mjs
        echo "✓ Firestore seeded with 50 products"
    else
        echo "✗ Node.js not found. Skipping Firestore seed."
        echo "  Install Node.js or run: node scripts/seed-firestore.mjs"
    fi
fi

echo
echo "━━━ COMPLETE ━━━"
