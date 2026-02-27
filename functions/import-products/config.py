"""
Configuration for the product import job.

Reads settings from environment variables and Firestore config document.
"""

import os
import logging

from google.cloud import firestore

logger = logging.getLogger(__name__)

# Firestore config document path
CONFIG_DOC = "config/importSettings"

# Defaults (used when Firestore config doc doesn't exist yet)
DEFAULTS = {
    "enabled": True,
    "minPrice": 3.0,
    "minSuppliers": 2,  # only include products on at least 2 chains
    "allowedCategories": [],  # empty = allow all
}


def get_firestore_client():
    """Return a Firestore client using default credentials."""
    project = os.environ.get("GOOGLE_CLOUD_PROJECT")
    return firestore.Client(project=project)


def load_import_settings(db):
    """
    Load import settings from Firestore config/importSettings.
    Falls back to DEFAULTS if the document doesn't exist.
    """
    doc = db.document(CONFIG_DOC).get()
    if doc.exists:
        settings = doc.to_dict()
        logger.info("Loaded import settings from Firestore: %s", settings)
        return settings

    logger.warning(
        "No import settings found at %s, using defaults: %s",
        CONFIG_DOC,
        DEFAULTS,
    )
    return dict(DEFAULTS)


def update_run_status(db, status, product_count=0):
    """Write run status back to the config document."""
    from google.cloud.firestore import SERVER_TIMESTAMP

    db.document(CONFIG_DOC).set(
        {
            "lastRunAt": SERVER_TIMESTAMP,
            "lastRunStatus": status,
            "lastRunProductCount": product_count,
        },
        merge=True,
    )
