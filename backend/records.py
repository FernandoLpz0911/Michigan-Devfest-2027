"""All records: filter entries in SQLite, return a RecordPage or CSV text."""
import csv
import io
import json

PAGE_SIZE = 50
_COLUMNS = [("lot", "Lot number"), ("part", "Part number"), ("quantity", "Quantity"), ("time", "Time"),
            ("machine", "Machine"), ("operator", "Operator"), ("shift", "Shift"), ("step", "Process step"),
            ("alarm", "Machine stop"), ("source_file", "File"), ("source_row", "Row")]


def _where(filters):
    parts, args = [], []
    if filters.get("q"):
        like = f"%{filters['q'].lower()}%"
        parts.append("(lower(lot) LIKE ? OR lower(json_extract(body,'$.part')) LIKE ? "
                     "OR lower(json_extract(body,'$.operator')) LIKE ?)")
        args += [like] * 3
    for key in ("machine", "shift"):
        if filters.get(key):
            parts.append(f"json_extract(body,'$.{key}') = ?")
            args.append(filters[key])
    if filters.get("stop"):
        parts.append("json_extract(body,'$.alarm') = ?")
        args.append(filters["stop"])
    if filters.get("date_from"):
        parts.append("substr(time,1,10) >= ?")
        args.append(filters["date_from"])
    if filters.get("date_to"):
        parts.append("substr(time,1,10) <= ?")
        args.append(filters["date_to"])
    if filters.get("only_cleaned"):
        # Every date is rewritten to one format, so a date alone does not count as cleaned.
        parts.append("EXISTS (SELECT 1 FROM json_each(json_extract(body,'$.changed')) WHERE value != 'time')")
    return (" WHERE " + " AND ".join(parts)) if parts else "", args


def _distinct(con, key):
    sql = f"SELECT DISTINCT json_extract(body,'$.{key}') v FROM entries WHERE v IS NOT NULL AND v != '' ORDER BY v"
    return [r[0] for r in con.execute(sql)]


def _entries(con, filters, limit=None, offset=0):
    where, args = _where(filters)
    sql = f"SELECT body FROM entries{where} ORDER BY time, source_file, source_row"
    if limit is not None:
        sql += " LIMIT ? OFFSET ?"
        args += [limit, offset]
    return [json.loads(r[0]) for r in con.execute(sql, args)]


def query_records(con, filters, page):
    page = max(1, int(page or 1))
    total = con.execute("SELECT COUNT(*) FROM entries").fetchone()[0]
    if filters.get("only_held"):
        like = f"%{(filters.get('q') or '').lower()}%"
        held = [json.loads(r[0]) for r in con.execute(
            "SELECT body FROM held WHERE lower(body) LIKE ? ORDER BY file_id, source_row", (like,))]
        matching, rows = len(held), held[(page - 1) * PAGE_SIZE: page * PAGE_SIZE]
    else:
        where, args = _where(filters)
        matching = con.execute(f"SELECT COUNT(*) FROM entries{where}", args).fetchone()[0]
        rows = _entries(con, filters, PAGE_SIZE, (page - 1) * PAGE_SIZE)
    low, high = con.execute("SELECT MIN(substr(time,1,10)), MAX(substr(time,1,10)) FROM entries").fetchone()
    shown = {k: filters.get(k) for k in ("q", "machine", "shift", "date_from", "date_to", "stop")}
    shown.update(only_cleaned=bool(filters.get("only_cleaned")), only_held=bool(filters.get("only_held")))
    return {"filters": shown, "page": page, "page_size": PAGE_SIZE, "total": total, "matching": matching,
            "rows": rows,
            "options": {"machine": _distinct(con, "machine"), "shift": _distinct(con, "shift"),
                        "stop": _distinct(con, "alarm"), "date_min": low, "date_max": high}}


def records_csv(con, filters):
    out = io.StringIO()
    writer = csv.writer(out, lineterminator="\n")
    writer.writerow([name for _, name in _COLUMNS])
    for e in _entries(con, filters):
        writer.writerow(["" if e.get(k) is None else e[k] for k, _ in _COLUMNS])
    return out.getvalue()
