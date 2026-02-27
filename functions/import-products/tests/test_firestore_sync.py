"""Tests for firestore_sync — uses mocked Firestore client."""

import sys
import os
from unittest.mock import MagicMock, patch, call
from datetime import datetime, timezone, timedelta
from types import ModuleType

# Mock google.cloud.firestore before importing firestore_sync
_mock_firestore_mod = ModuleType("google.cloud.firestore")
_mock_firestore_mod.SERVER_TIMESTAMP = "SERVER_TIMESTAMP_SENTINEL"
_mock_google = ModuleType("google")
_mock_google_cloud = ModuleType("google.cloud")
_mock_google.cloud = _mock_google_cloud
sys.modules["google"] = _mock_google
sys.modules["google.cloud"] = _mock_google_cloud
sys.modules["google.cloud.firestore"] = _mock_firestore_mod

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from firestore_sync import sync_products, IMPORT_SOURCE, STALE_THRESHOLD_WEEKS


def _make_mock_db(existing_docs=None):
    """Create a mock Firestore client with optional existing documents."""
    db = MagicMock()
    batch = MagicMock()
    db.batch.return_value = batch

    # Mock query for existing products
    if existing_docs is None:
        existing_docs = []

    mock_stream = []
    for doc_data in existing_docs:
        mock_doc = MagicMock()
        mock_doc.to_dict.return_value = doc_data
        mock_doc.reference = MagicMock()
        mock_stream.append(mock_doc)

    query_mock = MagicMock()
    query_mock.stream.return_value = mock_stream
    db.collection.return_value.where.return_value = query_mock

    # Mock document creation
    new_doc_ref = MagicMock()
    new_doc_ref.id = "auto-generated-id"
    db.collection.return_value.document.return_value = new_doc_ref

    return db, batch


def test_creates_new_products():
    db, batch = _make_mock_db()
    products = {
        "111": {"name": "Milk", "priceRange": "₪8–12", "category": "Dairy"},
    }

    counts = sync_products(db, products)

    assert counts["created"] == 1
    assert counts["updated"] == 0
    assert batch.set.call_count == 1

    # Verify the created document has correct fields
    set_call = batch.set.call_args
    doc_data = set_call[0][1]
    assert doc_data["barcode"] == "111"
    assert doc_data["name"] == "Milk"
    assert doc_data["status"] == "active"
    assert doc_data["currentWeekVotes"] == 0
    assert doc_data["importSource"] == IMPORT_SOURCE


def test_updates_existing_products():
    existing = [
        {
            "barcode": "111",
            "name": "Old Milk",
            "priceRange": "₪7–10",
            "status": "active",
            "importSource": IMPORT_SOURCE,
        }
    ]
    db, batch = _make_mock_db(existing)
    products = {
        "111": {"name": "New Milk", "priceRange": "₪8–12", "category": "Dairy"},
    }

    counts = sync_products(db, products)

    assert counts["updated"] == 1
    assert counts["created"] == 0
    assert batch.update.call_count >= 1


def test_does_not_touch_vote_fields_on_update():
    existing = [
        {
            "barcode": "111",
            "name": "Milk",
            "priceRange": "₪7",
            "status": "boycotted",
            "currentWeekVotes": 500,
            "isPreviousBoycott": True,
            "importSource": IMPORT_SOURCE,
        }
    ]
    db, batch = _make_mock_db(existing)
    products = {
        "111": {"name": "Milk Updated", "priceRange": "₪8–12", "category": "Dairy"},
    }

    sync_products(db, products)

    # The update call should NOT contain vote fields
    update_call = batch.update.call_args
    update_data = update_call[0][1]
    assert "currentWeekVotes" not in update_data
    assert "isPreviousBoycott" not in update_data
    assert "status" not in update_data


def test_archives_stale_active_products():
    stale_date = datetime.now(timezone.utc) - timedelta(weeks=STALE_THRESHOLD_WEEKS + 1)
    existing = [
        {
            "barcode": "old-product",
            "name": "Stale Item",
            "status": "active",
            "lastImportedAt": stale_date,
            "importSource": IMPORT_SOURCE,
        }
    ]
    db, batch = _make_mock_db(existing)

    # Import with no products → the old one becomes stale
    counts = sync_products(db, {})

    assert counts["archived"] == 1


def test_does_not_archive_boycotted_products():
    stale_date = datetime.now(timezone.utc) - timedelta(weeks=STALE_THRESHOLD_WEEKS + 1)
    existing = [
        {
            "barcode": "boycotted-product",
            "name": "Important Item",
            "status": "boycotted",
            "lastImportedAt": stale_date,
            "importSource": IMPORT_SOURCE,
        }
    ]
    db, batch = _make_mock_db(existing)

    counts = sync_products(db, {})

    assert counts["archived"] == 0


def test_does_not_archive_recently_imported():
    recent_date = datetime.now(timezone.utc) - timedelta(weeks=1)
    existing = [
        {
            "barcode": "recent-product",
            "name": "Recent Item",
            "status": "active",
            "lastImportedAt": recent_date,
            "importSource": IMPORT_SOURCE,
        }
    ]
    db, batch = _make_mock_db(existing)

    counts = sync_products(db, {})

    assert counts["archived"] == 0


def test_filters_by_allowed_categories():
    db, batch = _make_mock_db()
    products = {
        "111": {"name": "Milk", "priceRange": "₪8", "category": "Dairy"},
        "222": {"name": "Shampoo", "priceRange": "₪25", "category": "Cosmetics"},
    }

    counts = sync_products(db, products, allowed_categories=["dairy"])

    assert counts["created"] == 1  # Only Milk, not Shampoo


def test_empty_products_dict():
    db, batch = _make_mock_db()
    counts = sync_products(db, {})
    assert counts["created"] == 0
    assert counts["updated"] == 0
