"""Glue used by main.py: upload, check answers, build, store, find, draft.

Each uploaded file keeps a small JSON record in DATA_DIR/files/<file_id>.json
with what the routes need to answer later (questions, labels, steps,
counters). Entries, held rows, Granite exchanges and counters live in SQLite.
"""
import json
import os
import re
import time
from datetime import datetime
from pathlib import Path

from rapidfuzz import process as fuzz_process

from backend import build, formats, granite, progress, reader, review, risk, store, types

STEP_TITLES = {"header": "Found the header", "granite": "Asked IBM Granite",
               "cleaning": "Cleaned the values", "records": "Built the records"}
WORKING = {"header": "Finding the header...", "granite": "Asking IBM Granite what the columns mean...",
           "cleaning": "Cleaning the values...", "records": "Building the records..."}
KNOWN_FIELDS = ("machine", "step", "part")
DEFAULT_SETTINGS = {"window_hours": 4, "hand_time_minutes": None}


class UserError(Exception):
    """An error the person can fix. Shown as {"error": {"message", "fix"}}."""

    def __init__(self, message, fix, status=400):
        super().__init__(message)
        self.message, self.fix, self.status = message, fix, status


# ---------- paths and small state ----------

def data_dir():
    d = Path(os.environ.get("DATA_DIR", "data"))
    for sub in ("formats", "uploads", "files"):
        (d / sub).mkdir(parents=True, exist_ok=True)
    return d


_con = None


def con():
    global _con
    if _con is None:
        _con = store.connect(str(data_dir() / "wrapper.db"))
    return _con


def _record_path(file_id):
    return data_dir() / "files" / f"{file_id}.json"


def _load(file_id):
    p = _record_path(file_id)
    if not re.fullmatch(r"f\d+", file_id) or not p.exists():
        raise UserError("That file was not found.", "Go back to Files and pick it again.", 404)
    return json.loads(p.read_text())


def _save(rec):
    _record_path(rec["file_id"]).write_text(json.dumps(rec))


def delete_file(file_id):
    """Remove one file and everything saved from it. Saved layouts stay, so its look-alikes stay automatic."""
    rec = _load(file_id)
    store.delete_file(con(), file_id)
    upload = Path(rec.get("path") or "")
    if upload.is_file() and upload.parent == data_dir() / "uploads":
        upload.unlink()
    _record_path(file_id).unlink()
    return {"deleted": file_id}


def _all_records():
    recs = [json.loads(p.read_text()) for p in (data_dir() / "files").glob("f*.json")]
    return sorted(recs, key=lambda r: int(r["file_id"][1:]))


def _next_file_id():
    nums = [int(p.stem[1:]) for p in (data_dir() / "files").glob("f*.json")]
    return f"f{max(nums, default=0) + 1}"


def _now():
    return datetime.now().strftime("%Y-%m-%dT%H:%M")


# ---------- upload ----------

def save_upload(filename, content):
    name = Path(filename or "").name
    if not name.lower().endswith((".csv", ".xlsx", ".xls")):
        raise UserError("This file type can't be read.", "Save it as CSV or Excel (.xlsx) and drop it again.")
    if not content:
        raise UserError("This file is empty.", "Check that the file has rows, then drop it again.")
    file_id = _next_file_id()
    path = data_dir() / "uploads" / f"{file_id}_{name}"
    path.write_bytes(content)
    rec = {"file_id": file_id, "source_file": name, "path": str(path), "status": "working",
           "step": "header", "recognized": False, "format_id": None, "error": None,
           "timings": {"header": 0, "granite": 0, "cleaning": 0, "records": 0}, "started": time.time()}
    _save(rec)
    progress.set_step(file_id, "header")
    return rec


def process(rec):
    """Steps 1 to 5 (new layout) or 1, 2, 7, 8 (recognized). Returns a FileResult."""
    file_id = rec["file_id"]
    try:
        t0 = time.time()
        table = reader.read_table(rec["path"], rec["source_file"])
        if not table["headers"] or not table["rows"]:
            raise UserError("No rows were found in this file.",
                            "Check that the file has a header row and data under it.")
        profiles = types.profile_columns(table["headers"], table["rows"])
        rec["timings"]["header"] = round(time.time() - t0, 2)
        rec["data_rows"] = len(table["rows"])

        match = formats.match_format(table["headers"], formats.load_formats(str(data_dir() / "formats")))
        if match["matched"]:
            return _recognized(rec, table, match)

        _set_step(rec, "granite")
        t0 = time.time()
        log = []
        labels, fb1 = granite.label_columns(profiles, file_id, log=log)
        merges, fb2 = granite.propose_merges(profiles, labels, file_id, log=log)
        _save_exchanges(log)
        rec["timings"]["granite"] = round(time.time() - t0, 2)
        fell_back = fb1 or fb2
        if fb1:
            merges = []
        checked = review.build_questions(profiles, labels, merges, fb1)
        rec.update({"status": "needs_check", "step": "done", "profiles": profiles, "labels": labels,
                    "merges": merges, "questions": checked["questions"], "matched": checked["matched"],
                    "fell_back": fell_back, "new_columns": [], "granite_used": True})
        progress.set_step(file_id, "done")
        _save(rec)
        return file_result(rec)
    except UserError as e:
        _fail(rec, e.message, e.fix)
        raise
    except Exception as e:  # never leave a file stuck in "working"
        _fail(rec, "This file could not be read.", "Check that it opens in Excel, then drop it again.")
        raise UserError("This file could not be read.", "Check that it opens in Excel, then drop it again.") from e


def _set_step(rec, step):
    rec["step"] = step
    progress.set_step(rec["file_id"], step)
    _save(rec)


def _fail(rec, message, fix):
    rec.update({"status": "error", "step": "done", "error": {"message": message, "fix": fix}})
    _save(rec)


def _save_exchanges(log):
    for ex in log:
        ex["exchange_id"] = f"g{int(time.time() * 1000)}{ex['exchange_id']}"
        store.save_exchange(con(), ex)


def _recognized(rec, table, match):
    fmt = next(f for f in formats.load_formats(str(data_dir() / "formats")) if f["format_id"] == match["format_id"])
    mapping = {h: fmt["mapping"].get(match["header_map"].get(h), "extra") for h in table["headers"]}
    file_fmt = dict(fmt, headers=table["headers"], mapping=mapping)
    rec.update({"recognized": True, "format_id": fmt["format_id"], "new_columns": match["new_columns"],
                "questions": [], "fell_back": False, "granite_used": False,
                "matched": [{"position": i, "header": h, "field": mapping[h], "decided_by": "format"}
                            for i, h in enumerate(table["headers"])]})
    _build_and_store(rec, table, file_fmt, columns_right=None)
    return file_result(rec)


# ---------- answers ----------

def _field_of_question(q, labels_by_pos):
    if q["kind"] == "missing":
        return "lot" if "lot" in q["title"].lower() else "time"
    return labels_by_pos.get(q["positions"][0])


def apply_answers(file_id, answers):
    rec = _load(file_id)
    if rec["status"] != "needs_check":
        raise UserError("This file has no questions waiting.", "Go back to Files.")
    given = {a["question_id"]: a.get("value") for a in answers}
    headers = [p["header"] for p in rec["profiles"]]
    labels_by_pos = {lb["position"]: lb.get("field") for lb in rec["labels"]}
    mapping = {headers[m["position"]]: m["field"] for m in rec["matched"]}
    rules = {}
    for q in rec["questions"]:
        value = given.get(q["question_id"])
        if value is None:
            raise UserError("Some questions have no answer yet.", "Answer every question, then press Save.")
        field = _field_of_question(q, labels_by_pos)
        if q["kind"] in ("unsure", "type_conflict"):
            mapping[headers[q["positions"][0]]] = value
        elif q["kind"] == "duplicate":
            for pos in q["positions"]:
                mapping[headers[pos]] = field if str(pos) == str(value) else "extra"
        elif q["kind"] == "missing":
            if value != "none":
                mapping[headers[int(value)]] = field
        elif q["kind"] == "merge":
            mapping.setdefault(headers[q["positions"][0]], field or "extra")
            if value == "yes":
                merge = next((m for m in rec["merges"] if m["position"] == q["positions"][0]), None)
                if merge and field:
                    rules.setdefault(field, {}).update({v: merge["name"] for v in merge["values"] if v != merge["name"]})
    for h in headers:
        mapping.setdefault(h, "extra")
    mapping = _one_column_per_field(headers, mapping)

    fmt = formats.save_format({"name": rec["source_file"], "headers": headers, "mapping": mapping,
                               "value_rules": rules, "created_at": _now()}, str(data_dir() / "formats"))
    rec["format_id"] = fmt["format_id"]
    right = sum(1 for i, h in enumerate(headers) if labels_by_pos.get(i) == mapping[h])
    table = reader.read_table(rec["path"], rec["source_file"])
    _build_and_store(rec, table, fmt, columns_right=right)
    rec["checked"] = len(rec["questions"])
    _save(rec)
    _save_known(fmt["format_id"], rec["file_id"])
    return {"file_id": file_id, "format_id": fmt["format_id"], "entries": rec["entries"],
            "held": rec["held"], "data_rows": rec["data_rows"], "status": "ready"}


def _one_column_per_field(headers, mapping):
    seen = set()
    for h in headers:
        f = mapping[h]
        if f != "extra":
            if f in seen:
                mapping[h] = "extra"
            seen.add(f)
    return mapping


# ---------- build, store, counters ----------

def _known_path(format_id):
    return data_dir() / "formats" / f"{format_id}.known.json"


def _save_known(format_id, file_id):
    vals = {f: sorted({e[f] for e in store.all_entries(con()) if e["file_id"] == file_id and e.get(f)})
            for f in KNOWN_FIELDS}
    _known_path(format_id).write_text(json.dumps(vals))


def _unseen(rec, entries):
    p = _known_path(rec["format_id"])
    if not rec.get("recognized") or not p.exists():
        return []
    known = json.loads(p.read_text())
    counts = {}
    for e in entries:
        for f in KNOWN_FIELDS:
            v = e.get(f)
            if v and v not in known.get(f, []):
                counts[(f, v)] = counts.get((f, v), 0) + 1
    return [{"field": f, "value": v, "count": n} for (f, v), n in counts.items()]


def _build_and_store(rec, table, fmt, columns_right):
    file_id = rec["file_id"]
    _set_step(rec, "cleaning")
    t0 = time.time()
    built = build.build_entries(table, fmt, file_id)
    rec["timings"]["cleaning"] = round(time.time() - t0, 2)
    _set_step(rec, "records")
    t0 = time.time()
    store.save_entries(con(), built["entries"])
    store.save_held(con(), built["held"])
    rec["timings"]["records"] = round(time.time() - t0, 2)

    exchanges = store.exchanges(con(), file_id)
    tin = sum(x.get("tokens_in", 0) for x in exchanges)
    tout = sum(x.get("tokens_out", 0) for x in exchanges)
    counters = {
        "granite_calls": len(exchanges), "files_total": len(_all_records()),
        "files_with_granite": sum(1 for r in _all_records() if r.get("granite_used")),
        "seconds_to_records": round(time.time() - rec["started"], 1),
        "columns_right": columns_right, "columns_total": len(table["headers"]),
        "values_cleaned": built["values_cleaned"], "unseen_values": _unseen(rec, built["entries"]),
        "rows_held": len(built["held"]), "entries": len(built["entries"]), "data_rows": len(table["rows"]),
        "tokens_in": tin, "tokens_out": tout, "cost_usd": granite.cost(tin, tout)}
    store.save_counters(con(), file_id, counters)
    rec.update({"status": "ready", "step": "done", "entries": len(built["entries"]),
                "held": len(built["held"]), "data_rows": len(table["rows"])})
    progress.set_step(file_id, "done")
    _save(rec)


# ---------- read-only views of a file ----------

def _steps(rec):
    order = ["header", "granite", "cleaning", "records"]
    current = rec.get("step", "done")
    done_upto = 4 if current == "done" else order.index(current)
    if rec["status"] == "needs_check":
        done_upto = 2
    out = []
    for i, s in enumerate(order):
        if s == "granite" and rec.get("recognized"):
            state = "not_needed"
        elif i < done_upto:
            state = "done"
        elif i == done_upto and rec["status"] == "working":
            state = "current"
        else:
            state = "waiting"
        out.append({"step": s, "state": state, "title": STEP_TITLES[s], "detail": _step_detail(rec, s)})
    return out


def _step_detail(rec, s):
    t = rec.get("timings", {}).get(s, 0)
    if s == "header":
        return f"{rec.get('data_rows', 0)} data rows, {t} s."
    if s == "granite":
        return "Recognized from a file you checked earlier." if rec.get("recognized") else \
            f"What {len(rec.get('profiles') or [])} columns mean, {t} s."
    if s == "cleaning":
        return f"{t} s."
    return f"{rec.get('entries', 0)} records, {rec.get('held', 0)} held back."


def _sentence(rec):
    s = rec["status"]
    if s == "working":
        return WORKING.get(rec.get("step"), "Working...")
    if s == "needs_check":
        n = len(rec.get("questions") or [])
        return f"New layout. {n} thing{'s' if n != 1 else ''} to check."
    if s == "ready":
        if rec.get("recognized"):
            return "Recognized from a file you checked earlier."
        n = rec.get("checked", 0)
        return f"New layout. You checked {n} thing{'s' if n != 1 else ''}."
    return (rec.get("error") or {}).get("message", "Something went wrong.")


def file_result(rec):
    return {"file_id": rec["file_id"], "source_file": rec["source_file"], "recognized": rec.get("recognized", False),
            "format_id": rec.get("format_id"), "status": rec["status"], "questions": rec.get("questions", []),
            "matched": rec.get("matched", []), "new_columns": rec.get("new_columns", []), "steps": _steps(rec),
            "timings": rec["timings"], "fell_back": rec.get("fell_back", False)}


def file_status(file_id):
    rec = _load(file_id)
    return {"file_id": file_id, "source_file": rec["source_file"], "status": rec["status"],
            "step": rec.get("step", "done"), "sentence": _sentence(rec), "steps": _steps(rec),
            "error": rec.get("error")}


def file_rows():
    return [{"file_id": r["file_id"], "source_file": r["source_file"], "status": r["status"],
             "sentence": _sentence(r), "entries": r.get("entries", 0), "held": r.get("held", 0)}
            for r in _all_records()]


def file_detail(file_id):
    rec = _load(file_id)
    return {"file_id": file_id, "source_file": rec["source_file"], "recognized": rec.get("recognized", False),
            "steps": _steps(rec), "counters": store.get_counters(con(), file_id) or {}}


def file_exchanges(file_id):
    _load(file_id)
    return store.exchanges(con(), file_id)


def file_parts(file_id):
    """What See the file needs: the raw table, the format, matched columns, entries and held rows."""
    rec = _load(file_id)
    table = reader.read_table(rec["path"], rec["source_file"])
    fmt = None
    if rec.get("format_id"):
        fmt = next((f for f in formats.load_formats(str(data_dir() / "formats"))
                    if f["format_id"] == rec["format_id"]), None)
    if fmt and rec.get("recognized"):
        # The saved format is keyed by the first file's headers; this file may spell them differently.
        fmt = dict(fmt, mapping={m["header"]: m["field"] for m in rec.get("matched", [])})
    entries = [e for e in store.all_entries(con()) if e["file_id"] == file_id]
    held = [h for h in store.held_rows(con()) if h["file_id"] == file_id]
    return table, fmt, rec.get("matched", []), entries, held


# ---------- find a record ----------

LOT_LIKE = re.compile(r"^[A-Za-z0-9-]{1,12}$")


def find(text):
    text = (text or "").strip()
    if not text:
        raise UserError("Type a lot number or paste the buyer's message.", "Then press Find.")
    lots = store.lot_numbers(con())
    if " " not in text and (text in lots or LOT_LIKE.match(text)):
        reading = {"found": True, "lot": text, "part": None, "problem": None, "source": "typed"}
    else:
        log = []
        reading = granite.read_request(text, log=log)
        _save_exchanges(log)
    lot = reading.get("lot")
    history = store.lot_history(con(), lot) if lot else None
    if not history:
        closest = [m[0] for m in fuzz_process.extract(lot, lots, limit=3)] if lot and lots else []
        return {"reading": reading, "history": None, "links": [], "lots_in_week": 0, "closest": closest}
    if reading["source"] == "typed":
        reading["part"] = history.get("part")
    found = risk.find_links(lot, store.all_entries(con()), window_hours=settings()["window_hours"])
    return {"reading": reading, "history": history, "links": found["links"],
            "lots_in_week": found["lots_in_week"], "closest": []}


def draft(lot, reading):
    history = store.lot_history(con(), lot) if lot else None
    if not history:
        raise UserError("No records were found for that lot.", "Find the lot first, then draft the reply.", 404)
    found = risk.find_links(lot, store.all_entries(con()), window_hours=settings()["window_hours"])
    log = []
    out = granite.draft_reply(reading, history, found, log=log)
    _save_exchanges(log)
    return out


def held():
    return store.held_rows(con())


# ---------- settings ----------

def settings():
    p = data_dir() / "settings.json"
    if p.exists():
        return {**DEFAULT_SETTINGS, **json.loads(p.read_text())}
    return dict(DEFAULT_SETTINGS)


def save_settings(new):
    s = settings()
    if "window_hours" in new:
        try:
            s["window_hours"] = max(0.5, min(48.0, float(new["window_hours"])))
        except (TypeError, ValueError):
            raise UserError("The time window must be a number of hours.", "Type a number like 4.")
    if "hand_time_minutes" in new:
        v = new["hand_time_minutes"]
        try:
            s["hand_time_minutes"] = None if v in (None, "") else max(0.0, float(v))
        except (TypeError, ValueError):
            raise UserError("The hand time must be a number of minutes.", "Type a number like 45, or leave it empty.")
    (data_dir() / "settings.json").write_text(json.dumps(s))
    return s
