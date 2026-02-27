"""
Chain configuration for the product import job.

Each entry maps a human-readable name to the scraper enum value
used by il-supermarket-scraper. To add more chains, append to CHAINS
and ensure the enum exists in ScraperFactory.

Top Israeli supermarket chains by market share:
1. Shufersal (~30%)
2. Rami Levy (discount)
3. Victory (discount)
4. Yeinot Bitan / Carrefour
"""

CHAINS = [
    {"id": "SHUFERSAL", "name": "Shufersal"},
    {"id": "RAMI_LEVY", "name": "Rami Levy"},
    {"id": "VICTORY", "name": "Victory"},
    {"id": "YAYNO_BITAN", "name": "Yeinot Bitan"},
]
