"""SQLite store: entries, held-back rows, Granite exchanges, counters. Each shape is kept as JSON."""
import json
import sqlite3

_SCHEMA = """
CREATE TABLE IF NOT EXISTS entries (entry_id TEXT PRIMARY KEY, lot TEXT, time TEXT,
  source_file TEXT, source_row INTEGER, body TEXT);
CREATE INDEX IF NOT EXISTS entries_lot ON entries (lot);
CREATE TABLE IF NOT EXISTS held (file_id TEXT, source_row INTEGER, body TEXT, PRIMARY KEY (file_id, source_row));
CREATE TABLE IF NOT EXISTS exchanges (seq INTEGER PRIMARY KEY AUTOINCREMENT, file_id TEXT, body TEXT);
CREATE TABLE IF NOT EXISTS counters (file_id TEXT PRIMARY KEY, body TEXT);
"""
_ORDER = "ORDER BY time, source_file, source_row"


def connect(db_path):
    con = sqlite3.connect(db_path, check_same_thread=False)
    con.executescript(_SCHEMA)
    return con


def _bodies(con, sql, args=()):
    return [json.loads(r[0]) for r in con.execute(sql, args)]


def save_entries(con, entries):
    con.executemany("INSERT OR REPLACE INTO entries VALUES (?,?,?,?,?,?)",
                    [(e["entry_id"], e["lot"], e["time"], e["source_file"], e["source_row"], json.dumps(e))
                     for e in entries])
    con.commit()


def save_held(con, held):
    con.executemany("INSERT OR REPLACE INTO held VALUES (?,?,?)",
                    [(h["file_id"], h["source_row"], json.dumps(h)) for h in held])
    con.commit()


def lot_history(con, lot):
    entries = _bodies(con, f"SELECT body FROM entries WHERE lot=? {_ORDER}", (lot,))
    if not entries:
        return None
    return {"lot": lot, "part": entries[0].get("part"), "entries": entries}


def all_entries(con):
    return _bodies(con, f"SELECT body FROM entries {_ORDER}")


def held_rows(con):
    return _bodies(con, "SELECT body FROM held ORDER BY file_id, source_row")


def lot_numbers(con):
    return [r[0] for r in con.execute("SELECT DISTINCT lot FROM entries ORDER BY lot")]


def delete_file(con, file_id):
    con.execute("DELETE FROM entries WHERE json_extract(body, '$.file_id') = ?", (file_id,))
    for table in ("held", "exchanges", "counters"):
        con.execute(f"DELETE FROM {table} WHERE file_id = ?", (file_id,))
    con.commit()


def save_exchange(con, exchange):
    con.execute("INSERT INTO exchanges (file_id, body) VALUES (?,?)", (exchange.get("file_id"), json.dumps(exchange)))
    con.commit()


def exchanges(con, file_id):
    return _bodies(con, "SELECT body FROM exchanges WHERE file_id=? ORDER BY seq", (file_id,))


def save_counters(con, file_id, counters):
    con.execute("INSERT OR REPLACE INTO counters VALUES (?,?)", (file_id, json.dumps(counters)))
    con.commit()


def get_counters(con, file_id):
    rows = _bodies(con, "SELECT body FROM counters WHERE file_id=?", (file_id,))
    return rows[0] if rows else None
