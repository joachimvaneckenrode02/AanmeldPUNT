"""
MongoDB Atlas database layer using Motor (async MongoDB driver).
Drop-in replacement for the previous SQLite-based db.py.
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'aanmeldpunt')

COLLECTIONS = [
    "users", "schools", "user_schools", "classes", "study_types",
    "availability_rules", "exclusion_dates", "study_moments",
    "registrations", "attendance", "email_templates", "audit_logs", "students",
]


# ── Cursor wrapper ───────────────────────────────────────────────────────────

class _CursorWrapper:
    """Wraps a Motor cursor to ensure _id is excluded from results."""

    def __init__(self, cursor):
        self._cursor = cursor

    def sort(self, key, direction=1):
        self._cursor = self._cursor.sort(key, direction)
        return self

    def limit(self, n: int):
        self._cursor = self._cursor.limit(n)
        return self

    def skip(self, n: int):
        self._cursor = self._cursor.skip(n)
        return self

    async def to_list(self, length=None):
        docs = await self._cursor.to_list(length=length)
        # Strip _id from all documents
        for doc in docs:
            doc.pop("_id", None)
        return docs


# ── Collection wrapper ───────────────────────────────────────────────────────

class Collection:
    """Wraps a Motor collection to auto-exclude _id from results."""

    def __init__(self, motor_collection):
        self._col = motor_collection

    async def find_one(self, query=None, projection=None):
        query = query or {}
        # Always exclude _id unless explicitly requested
        if projection is None:
            projection = {"_id": 0}
        elif isinstance(projection, dict) and "_id" not in projection:
            projection["_id"] = 0
        doc = await self._col.find_one(query, projection)
        return doc

    def find(self, query=None, projection=None):
        query = query or {}
        if projection is None:
            projection = {"_id": 0}
        elif isinstance(projection, dict) and "_id" not in projection:
            projection["_id"] = 0
        cursor = self._col.find(query, projection)
        return _CursorWrapper(cursor)

    async def insert_one(self, doc: dict):
        doc.pop("_id", None)
        return await self._col.insert_one(doc)

    async def update_one(self, query: dict, update: dict):
        return await self._col.update_one(query, update)

    async def update_many(self, query: dict, update: dict):
        return await self._col.update_many(query, update)

    async def delete_one(self, query: dict):
        return await self._col.delete_one(query)

    async def delete_many(self, query: dict):
        return await self._col.delete_many(query)

    async def count_documents(self, query=None):
        query = query or {}
        return await self._col.count_documents(query)


# ── Database ─────────────────────────────────────────────────────────────────

class Database:
    """Mimics the previous Database interface, backed by real MongoDB."""

    def __init__(self, mongo_url: str, db_name: str):
        self._client = AsyncIOMotorClient(mongo_url)
        self._db = self._client[db_name]
        self._collections = {}

    def __getattr__(self, name: str) -> Collection:
        if name.startswith("_"):
            raise AttributeError(name)
        if name not in self._collections:
            self._collections[name] = Collection(self._db[name])
        return self._collections[name]

    def get_collection(self, name: str) -> Collection:
        return Collection(self._db[name])

    async def init_tables(self):
        """Create indexes for commonly queried fields."""
        # Users
        await self._db.users.create_index("id", unique=True)
        await self._db.users.create_index("email", unique=True)
        # Schools
        await self._db.schools.create_index("id", unique=True)
        await self._db.schools.create_index("slug", unique=True)
        await self._db.schools.create_index("accessCode")
        # User-School links
        await self._db.user_schools.create_index("id", unique=True)
        await self._db.user_schools.create_index([("userId", 1), ("schoolId", 1)])
        # Classes
        await self._db.classes.create_index("id", unique=True)
        await self._db.classes.create_index("schoolId")
        # Study Types
        await self._db.study_types.create_index("id", unique=True)
        await self._db.study_types.create_index("schoolId")
        # Availability Rules
        await self._db.availability_rules.create_index("id", unique=True)
        await self._db.availability_rules.create_index("schoolId")
        # Exclusion Dates
        await self._db.exclusion_dates.create_index("id", unique=True)
        await self._db.exclusion_dates.create_index("schoolId")
        # Study Moments
        await self._db.study_moments.create_index("id", unique=True)
        await self._db.study_moments.create_index("schoolId")
        await self._db.study_moments.create_index("date")
        # Registrations
        await self._db.registrations.create_index("id", unique=True)
        await self._db.registrations.create_index("schoolId")
        await self._db.registrations.create_index("studyMomentId")
        # Attendance
        await self._db.attendance.create_index("id", unique=True)
        await self._db.attendance.create_index("studyMomentId")
        # Students
        await self._db.students.create_index("id", unique=True)
        await self._db.students.create_index("schoolId")
        # Audit Logs
        await self._db.audit_logs.create_index("id", unique=True)
        # Email Templates
        await self._db.email_templates.create_index("id", unique=True)

    def close(self):
        self._client.close()


# ── Factory ──────────────────────────────────────────────────────────────────

def create_db(path=None) -> Database:
    """Create a Database backed by MongoDB Atlas.
    The `path` argument is ignored (kept for backward compatibility).
    """
    return Database(MONGO_URL, DB_NAME)
