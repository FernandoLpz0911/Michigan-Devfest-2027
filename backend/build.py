"""Apply a format to a RawTable: clean values, normalize times, build entries, hold back bad rows."""
import re
from datetime import datetime, timezone

_TIME_FORMATS = ["%m/%d/%y %I:%M%p", "%m/%d/%Y %I:%M%p", "%m/%d/%Y %H:%M", "%m/%d/%y %H:%M",
                 "%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M", "%Y-%m-%d", "%d-%b-%Y %H:%M", "%d-%b-%y %H:%M"]
_HELD_TEXT = {"no_lot": "No lot number", "bad_time": "Time unreadable", "empty": "Empty"}
_MERGED = ("machine", "step", "part")


def normalize_time(text):
    """Return YYYY-MM-DDTHH:MM, or None when the style is not supported."""
    t = re.sub(r"\s+", " ", (text or "").strip())
    if re.fullmatch(r"1\d{9}(\.\d+)?", t):
        # Machine clocks count seconds since 1970 (UTC), read as wall clock like +00:00 times.
        return datetime.fromtimestamp(float(t), timezone.utc).strftime("%Y-%m-%dT%H:%M")
    t = re.sub(r"(\d{2}:\d{2}):\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$", r"\1", t)
    t = re.sub(r"(?<=\d)\s*([AP])M?$", r"\1M", t, flags=re.I).upper()
    t = re.sub(r"(?<=\d) (AM|PM)$", r"\1", t)
    for f in _TIME_FORMATS:
        try:
            return datetime.strptime(t, f).strftime("%Y-%m-%dT%H:%M")
        except ValueError:
            pass
    return None


def _quantity(text):
    return int(text) if re.fullmatch(r"-?\d+", text) else None


def build_entries(table, fmt, file_id):
    headers, mapping = table["headers"], fmt["mapping"]
    rules = fmt.get("value_rules", {})
    col = {}  # field -> index of its (first) column
    for i, h in enumerate(headers):
        f = mapping.get(h, "extra")
        if f != "extra":
            col.setdefault(f, i)
    entries, held, cleaned, unseen = [], [], 0, {}
    for cells, src in zip(table["rows"], table["source_rows"]):
        cells = list(cells) + [""] * (len(headers) - len(cells))
        original = dict(zip(headers, cells))
        reason = None
        vals = {}
        if not any(c.strip() for c in cells):
            reason = "empty"
        else:
            for f, i in col.items():
                v = cells[i].strip()
                r = rules.get(f)
                if r:
                    if v in r:
                        if r[v] != v:
                            cleaned += 1
                        v = r[v]
                    elif f in _MERGED and v and v not in r.values():
                        unseen[(f, v)] = unseen.get((f, v), 0) + 1
                vals[f] = v
            # A file with no lot column (a machine log) keeps its rows as lot-less entries;
            # only a blank cell in a lot column holds the row back.
            if "lot" in col and not vals.get("lot"):
                reason = "no_lot"
            else:
                vals["time"] = normalize_time(cells[col["time"]]) if "time" in col else None
                if vals["time"] is None:
                    reason = "bad_time"
        if reason:
            held.append({"file_id": file_id, "source_file": table["source_file"], "source_row": src,
                         "original_row": original, "reason": reason, "reason_text": _HELD_TEXT[reason]})
            continue
        e = {"entry_id": f"{file_id}-r{src}"}
        for f in ("lot", "part", "quantity", "time", "machine", "operator", "shift", "step", "alarm"):
            v = vals.get(f)
            e[f] = _quantity(v) if f == "quantity" and v is not None else (v or None)
        e["extra"] = {h: original[h] for h in headers if mapping.get(h, "extra") == "extra"}
        e.update(source_file=table["source_file"], file_id=file_id, source_row=src, original_row=original)
        raw = lambda f: original[headers[col[f]]]
        e["changed"] = [f for f in col if ("" if e[f] is None else str(e[f])) != raw(f)]
        entries.append(e)
    return {"entries": entries, "held": held, "values_cleaned": cleaned,
            "unseen_values": [{"field": f, "value": v, "count": n} for (f, v), n in unseen.items()]}
