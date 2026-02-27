"""Tests for parser.deduplicate_products()"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from parser import deduplicate_products


def test_single_record():
    records = [{"barcode": "123", "name": "Milk", "price": 8.0, "category": "Dairy"}]
    result = deduplicate_products(records)
    assert "123" in result
    assert result["123"]["name"] == "Milk"
    assert result["123"]["priceRange"] == "₪8"
    assert result["123"]["category"] == "Dairy"


def test_multiple_prices_same_barcode():
    records = [
        {"barcode": "123", "name": "Milk", "price": 8.0, "category": "Dairy"},
        {"barcode": "123", "name": "Milk", "price": 12.0, "category": "Dairy"},
        {"barcode": "123", "name": "Milk 1L", "price": 10.0, "category": "Dairy"},
    ]
    result = deduplicate_products(records)
    assert len(result) == 1
    assert result["123"]["priceRange"] == "₪8–12"


def test_most_common_name_wins():
    records = [
        {"barcode": "123", "name": "Milk", "price": 8.0, "category": ""},
        {"barcode": "123", "name": "Milk", "price": 9.0, "category": ""},
        {"barcode": "123", "name": "Milk 1L", "price": 10.0, "category": ""},
    ]
    result = deduplicate_products(records)
    assert result["123"]["name"] == "Milk"


def test_min_price_filter():
    records = [
        {"barcode": "cheap", "name": "Gum", "price": 1.5, "category": ""},
        {"barcode": "normal", "name": "Bread", "price": 12.0, "category": ""},
    ]
    result = deduplicate_products(records, min_price=3.0)
    assert "cheap" not in result
    assert "normal" in result


def test_min_price_uses_max_price():
    """A product with some prices above threshold should be kept."""
    records = [
        {"barcode": "123", "name": "Milk", "price": 2.0, "category": ""},
        {"barcode": "123", "name": "Milk", "price": 5.0, "category": ""},
    ]
    result = deduplicate_products(records, min_price=3.0)
    assert "123" in result


def test_different_barcodes_stay_separate():
    records = [
        {"barcode": "111", "name": "Milk", "price": 8.0, "category": "Dairy"},
        {"barcode": "222", "name": "Bread", "price": 12.0, "category": "Bakery"},
    ]
    result = deduplicate_products(records)
    assert len(result) == 2
    assert result["111"]["name"] == "Milk"
    assert result["222"]["name"] == "Bread"


def test_empty_records():
    result = deduplicate_products([])
    assert result == {}


def test_single_price_no_range_dash():
    records = [{"barcode": "123", "name": "Water", "price": 5.0, "category": ""}]
    result = deduplicate_products(records)
    assert result["123"]["priceRange"] == "₪5"


def test_most_common_category():
    records = [
        {"barcode": "123", "name": "X", "price": 10.0, "category": "Dairy"},
        {"barcode": "123", "name": "X", "price": 11.0, "category": "Dairy"},
        {"barcode": "123", "name": "X", "price": 12.0, "category": "Milk"},
    ]
    result = deduplicate_products(records)
    assert result["123"]["category"] == "Dairy"
