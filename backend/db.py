"""
SQLite database layer with a MongoDB-compatible async API.
Drop-in replacement for motor.motor_asyncio — no external DB needed.
"""
import aiosqlite
import json
import re
import uuid
from pathlib import Path

DB_PATH = Path(__file__).parent / "aanmeldpunt.db"

COLLECTIONS = [
    "users", "schools", "user_schools", "classes", "study_types",
    "availability_rules", "exclusion_dates", "study_moments",
    "registrations", "attendance", "email_templates", "audit_logs", "students",
]


# ── Query / update helpers ───────────────────────────────────────────────────

def _match(doc: dict, query: dict) -> bool:
    """Evaluate a MongoDB-style filter against a plain dict."""
    for key, val in query.items():
        if key == "_id":
            continue
        doc_val = doc.get(key)
        if isinstance(val, dict):
            # Collect operators for this field
            ops = val
            # Handle $regex + $options together
            if "$regex" in ops:
                pattern = ops["$regex"]
                options = ops.get("$options", "")
                flags = 0
                if "i" in options:
                    flags |= re.IGNORECASE
                if doc_val is None or not re.search(pattern, str(doc_val), flags):
                    return False
                # Skip $options since we already handled it
                remaining = {k: v for k, v in ops.items() if k not in ("$regex", "$options")}
            else:
                remaining = ops

            for op, op_val in remaining.items():
                if op == "$in":
                    if doc_val not in op_val:
                        return False
                elif op == "$nin":
                    if doc_val in op_val:
                        return False
                elif op == "$ne":
                    if doc_val == op_val:
                        return False
                elif op == "$gt":
                    if doc_val is None or doc_val <= op_val:
                        return False
                elif op == "$gte":
                    if doc_val is None or doc_val < op_val:
                        return False
                elif op == "$lt":
                    if doc_val is None or doc_val >= op_val:
                        return False
                elif op == "$lte":
                    if doc_val is None or doc_val > op_val:
                        return False
                elif op == "$exists":
                    if op_val and doc_val is None:
                        return False
                    if not op_val and doc_val is not None:
                        return False
        else:
            if doc_val != val:
                return False
    return True


def _apply_update(doc: dict, update: dict) -> dict:
    """Apply MongoDB-style update operators ($set, $unset, $inc, $push)."""
    if "$set" in update:
        doc.update(update["$set"])
    if "$unset" in update:
        for k in update["$unset"]:
            doc.pop(k, None)
    if "$inc" in update:
        for k, v in update["$inc"].items():
            doc[k] = doc.get(k, 0) + v
    if "$push" in update:
        for k, v in update["$push"].items():
            doc.setdefault(k, []).append(v)
    return doc


# ── Cursor ───────────────────────────────────────────────────────────────────

class _Cursor:
    def __init__(self, db_path: str, table: str, query: dict):
        self._db_path = db_path
        self._table = table
        self._query = query
        self._sort_key: str | None = None
        self._sort_dir: int = 1
        self._limit: int | None = None

    def sort(self, key, direction=1):
        self._sort_key = key
        self._sort_dir = direction
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    def skip(self, n: int):
        # skip is rarely used but prevents AttributeError
        return self

    async def to_list(self, length=None):
        async with aiosqlite.connect(self._db_path) as conn:
            await _ensure_table(conn, self._table)
            async with conn.execute(f"SELECT data FROM {self._table}") as cur:
                rows = await cur.fetchall()

        docs = [json.loads(r[0]) for r in rows]
        docs = [d for d in docs if _match(d, self._query)]

        if self._sort_key:
            docs.sort(
                key=lambda x: (x.get(self._sort_key) is None, x.get(self._sort_key, "")),
                reverse=(self._sort_dir == -1),
            )
        if length is not None:
            docs = docs[:length]
        if self._limit is not None:
            docs = docs[:self._limit]
        return docs


# ── Table helper ─────────────────────────────────────────────────────────────

async def _ensure_table(conn, name: str):
    await conn.execute(
        f"CREATE TABLE IF NOT EXISTS {name} "
        "(id TEXT PRIMARY KEY, data TEXT NOT NULL)"
    )


# ── Collection ───────────────────────────────────────────────────────────────

class Collection:
    def __init__(self, db_path: str, name: str):
        self._db_path = db_path
        self._name = name

    # -- internal helpers
    async def _all(self, conn) -> list[dict]:
        await _ensure_table(conn, self._name)
        async with conn.execute(f"SELECT data FROM {self._name}") as cur:
            rows = await cur.fetchall()
        return [json.loads(r[0]) for r in rows]

    # -- public API (mirrors motor)
    async def find_one(self, query=None, projection=None):
        query = query or {}
        async with aiosqlite.connect(self._db_path) as conn:
            docs = await self._all(conn)
        for doc in docs:
            if _match(doc, query):
                return doc
        return None

    def find(self, query=None, projection=None):
        return _Cursor(self._db_path, self._name, query or {})

    async def insert_one(self, doc: dict):
        doc.pop("_id", None)
        doc_id = doc.setdefault("id", str(uuid.uuid4()))
        async with aiosqlite.connect(self._db_path) as conn:
            await _ensure_table(conn, self._name)
            await conn.execute(
                f"INSERT OR REPLACE INTO {self._name} (id, data) VALUES (?, ?)",
                (doc_id, json.dumps(doc)),
            )
            await conn.commit()

    async def update_one(self, query: dict, update: dict):
        async with aiosqlite.connect(self._db_path) as conn:
            docs = await self._all(conn)
            for doc in docs:
                if _match(doc, query):
                    _apply_update(doc, update)
                    await conn.execute(
                        f"UPDATE {self._name} SET data = ? WHERE id = ?",
                        (json.dumps(doc), doc["id"]),
                    )
                    await conn.commit()
                    return

    async def update_many(self, query: dict, update: dict):
        async with aiosqlite.connect(self._db_path) as conn:
            docs = await self._all(conn)
            for doc in docs:
                if _match(doc, query):
                    _apply_update(doc, update)
                    await conn.execute(
                        f"UPDATE {self._name} SET data = ? WHERE id = ?",
                        (json.dumps(doc), doc["id"]),
                    )
            await conn.commit()

    async def delete_one(self, query: dict):
        async with aiosqlite.connect(self._db_path) as conn:
            docs = await self._all(conn)
            for doc in docs:
                if _match(doc, query):
                    await conn.execute(
                        f"DELETE FROM {self._name} WHERE id = ?", (doc["id"],)
                    )
                    await conn.commit()
                    return

    async def delete_many(self, query: dict):
        async with aiosqlite.connect(self._db_path) as conn:
            docs = await self._all(conn)
            for doc in docs:
                if _match(doc, query):
                    await conn.execute(
                        f"DELETE FROM {self._name} WHERE id = ?", (doc["id"],)
                    )
            await conn.commit()

    async def count_documents(self, query=None):
        query = query or {}
        async with aiosqlite.connect(self._db_path) as conn:
            docs = await self._all(conn)
        return sum(1 for d in docs if _match(d, query))


# ── Database ─────────────────────────────────────────────────────────────────

class Database:
    """Mimics a Motor database object: `db.collection_name` returns a Collection."""

    def __init__(self, db_path: str | Path):
        self._db_path = str(db_path)

    def __getattr__(self, name: str) -> Collection:
        if name.startswith("_"):
            raise AttributeError(name)
        return Collection(self._db_path, name)

    def get_collection(self, name: str) -> Collection:
        return Collection(self._db_path, name)

    async def init_tables(self):
        async with aiosqlite.connect(self._db_path) as conn:
            for table in COLLECTIONS:
                await _ensure_table(conn, table)
            await conn.commit()

    def close(self):
        pass  # SQLite connections are opened/closed per request


# ── Factory ──────────────────────────────────────────────────────────────────

def create_db(path: Path = DB_PATH) -> Database:
    return Database(path)
