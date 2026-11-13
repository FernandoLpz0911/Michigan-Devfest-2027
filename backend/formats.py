import json
import os
import re

from rapidfuzz import fuzz

THRESHOLD = 80


def _no_match():
    return {"matched": False, "format_id": None, "header_map": {},
            "new_columns": [], "missing_columns": []}


def _key(text):
    return re.sub(r"[^A-Z0-9]", "", text.upper())


def _format_number(format_id):
    return int(format_id[3:])


def save_format(fmt, folder):
    os.makedirs(folder, exist_ok=True)
    numbers = [_format_number(f[:-5]) for f in os.listdir(folder)
               if re.match(r"fmt\d+\.json$", f)]
    saved = dict(fmt, format_id=f"fmt{max(numbers, default=0) + 1}")
    with open(os.path.join(folder, saved["format_id"] + ".json"), "w", encoding="utf-8") as f:
        json.dump(saved, f, indent=2)
    return saved


def load_formats(folder):
    if not os.path.isdir(folder):
        return []
    names = [f for f in os.listdir(folder) if re.match(r"fmt\d+\.json$", f)]
    formats = []
    for name in names:
        with open(os.path.join(folder, name), encoding="utf-8") as f:
            formats.append(json.load(f))
    return sorted(formats, key=lambda fmt: _format_number(fmt["format_id"]))


def _match_one(headers, fmt):
    header_map = {}
    left = list(headers)
    for fmt_header in fmt["headers"]:
        best, best_score = None, 0
        for h in left:
            score = fuzz.ratio(_key(h), _key(fmt_header))
            if score > best_score:
                best, best_score = h, score
        if best is not None and best_score >= THRESHOLD:
            header_map[best] = fmt_header
            left.remove(best)
        elif fmt["mapping"][fmt_header] != "extra":
            return _no_match()
    return {
        "matched": True,
        "format_id": fmt["format_id"],
        "header_map": header_map,
        "new_columns": [h for h in headers if h not in header_map],
        "missing_columns": [h for h in fmt["headers"] if h not in header_map.values()],
    }


def match_format(headers, formats):
    for fmt in formats:
        result = _match_one(headers, fmt)
        if result["matched"]:
            return result
    return _no_match()
