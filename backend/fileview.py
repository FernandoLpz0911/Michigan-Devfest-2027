"""See the file: the first 50 lines of a file with what each became (Card V)."""

LIMIT = 50


def _clean_cell(entry, field, header):
    if field == "extra":
        return entry["extra"].get(header) or ""
    value = entry.get(field)
    return "" if value is None else str(value)


def _matches(raw, clean, filters):
    cells = [c.lower() for c in raw + (clean or [])]
    if filters.get("q") and not any(filters["q"].lower() in c for c in cells):
        return False
    col, value = filters.get("column"), filters.get("value")
    if col is not None and value is not None:
        i = int(col)
        both = [raw[i] if i < len(raw) else "", clean[i] if clean and i < len(clean) else None]
        if value.lower() not in [str(c).lower() for c in both if c is not None]:
            return False
    return True


def file_view(table, fmt, matched, entries, held, file_id, filters=None, limit=LIMIT):
    """With filters (q, column, value, kind) rows are the header plus matching lines and `matching` is added."""
    filters = {k: v for k, v in (filters or {}).items() if v not in (None, "")}
    headers = table["headers"]
    fields = [fmt["mapping"].get(h, "extra") for h in headers]
    by_row = {m["position"]: m["decided_by"] for m in matched}
    by_entry = {e["source_row"]: e for e in entries}
    by_held = {h["source_row"]: h for h in held}
    width = len(headers)

    columns = [{"position": i, "header": h, "field": fields[i],
                "decided_by": by_row.get(i, "person"),
                "rows_changed": sum(1 for e in entries if fields[i] in e["changed"])}
               for i, h in enumerate(headers)]

    lines = []
    for s in table["skipped"]:
        reason = "blank row" if s["reason"] == "blank" else "title row"
        raw = [s["text"]] + [""] * (width - 1)
        lines.append((s["source_row"], "skipped", reason, raw, None))
    lines.append((table["header_row"], "header", None, list(headers), None))
    for n, raw in zip(table["source_rows"], table["rows"]):
        if n in by_entry:
            e = by_entry[n]
            clean = [_clean_cell(e, f, h) for f, h in zip(fields, headers)]
            lines.append((n, "entry", None, raw, clean))
        elif n in by_held:
            lines.append((n, "held", by_held[n]["reason_text"], raw, None))
    lines.sort(key=lambda x: x[0])

    total = len(lines)
    if filters:
        lines = [l for l in lines if l[1] == "header" or (
            l[1] in ("entry", "held") and filters.get("kind") in (None, l[1]) and _matches(l[3], l[4], filters))]
        matching = sum(1 for l in lines if l[1] != "header")
    rows = [{"source_row": n, "kind": k, "reason_text": r, "raw": raw, "clean": c}
            for n, k, r, raw, c in (lines if limit is None else lines[:limit + (1 if filters else 0)])]
    out = {"file_id": file_id, "source_file": table["source_file"], "columns": columns,
           "rows": rows, "total_rows": total}
    if filters:
        out["matching"] = matching
    return out
