"""MongoDB client for Evently. Uses Django settings (MONGO_URI, MONGO_DB_NAME)."""
import os
import certifi
from django.conf import settings
from pymongo import MongoClient
from pymongo.database import Database


_default_uri = os.environ.get("MONGODB_URI") or getattr(settings, "MONGO_URI", "mongodb://localhost:27017/")
_db_name = os.environ.get("MONGODB_DB") or getattr(settings, "MONGO_DB_NAME", "evently")

_client = None
_db = None


def _get_client():
    global _client
    if _client is None:
        _client = MongoClient(
            _default_uri,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=3000,
        )
    return _client


def is_mongo_connected() -> bool:
    try:
        _get_client().admin.command("ping")
        return True
    except Exception:
        return False


def get_db() -> Database:
    global _db
    if _db is None:
        _db = _get_client()[_db_name]
    return _db


class _MongoDbProxy:
    """Proxy so mongo_db["venues"] works; connects on first access."""
    def __getitem__(self, name):
        return get_db()[name]


mongo_db = _MongoDbProxy()