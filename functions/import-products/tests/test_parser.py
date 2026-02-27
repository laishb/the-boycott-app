"""Tests for parser._read_parsed_output() with sample CSV fixtures."""

import csv
import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from parser import _read_parsed_output


def _write_csv(folder, filename, rows):
    """Write a CSV file with given rows (list of dicts)."""
    if not rows:
        return
    filepath = os.path.join(folder, filename)
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)


def test_reads_valid_csv():
    with tempfile.TemporaryDirectory() as tmpdir:
        _write_csv(
            tmpdir,
            "prices.csv",
            [
                {"ItemCode": "111", "ItemName": "Milk", "ItemPrice": "8.5", "ManufacturerName": "Tnuva"},
                {"ItemCode": "222", "ItemName": "Bread", "ItemPrice": "12.0", "ManufacturerName": "Angel"},
            ],
        )
        records = _read_parsed_output(tmpdir)
        assert len(records) == 2
        assert records[0]["barcode"] == "111"
        assert records[0]["name"] == "Milk"
        assert records[0]["price"] == 8.5
        assert records[0]["category"] == "Tnuva"


def test_skips_rows_with_missing_fields():
    with tempfile.TemporaryDirectory() as tmpdir:
        _write_csv(
            tmpdir,
            "prices.csv",
            [
                {"ItemCode": "", "ItemName": "NoCode", "ItemPrice": "5.0", "ManufacturerName": ""},
                {"ItemCode": "111", "ItemName": "", "ItemPrice": "5.0", "ManufacturerName": ""},
                {"ItemCode": "222", "ItemName": "Valid", "ItemPrice": "10.0", "ManufacturerName": "X"},
            ],
        )
        records = _read_parsed_output(tmpdir)
        assert len(records) == 1
        assert records[0]["barcode"] == "222"


def test_skips_invalid_prices():
    with tempfile.TemporaryDirectory() as tmpdir:
        _write_csv(
            tmpdir,
            "prices.csv",
            [
                {"ItemCode": "111", "ItemName": "Bad", "ItemPrice": "abc", "ManufacturerName": ""},
                {"ItemCode": "222", "ItemName": "Zero", "ItemPrice": "0", "ManufacturerName": ""},
                {"ItemCode": "333", "ItemName": "Negative", "ItemPrice": "-5", "ManufacturerName": ""},
                {"ItemCode": "444", "ItemName": "Good", "ItemPrice": "15.5", "ManufacturerName": ""},
            ],
        )
        records = _read_parsed_output(tmpdir)
        assert len(records) == 1
        assert records[0]["barcode"] == "444"


def test_reads_nested_csv_files():
    with tempfile.TemporaryDirectory() as tmpdir:
        subdir = os.path.join(tmpdir, "chain1", "store42")
        os.makedirs(subdir)
        _write_csv(
            subdir,
            "prices.csv",
            [{"ItemCode": "111", "ItemName": "Milk", "ItemPrice": "8.0", "ManufacturerName": ""}],
        )
        records = _read_parsed_output(tmpdir)
        assert len(records) == 1


def test_empty_folder():
    with tempfile.TemporaryDirectory() as tmpdir:
        records = _read_parsed_output(tmpdir)
        assert records == []
