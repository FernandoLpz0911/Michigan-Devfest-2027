"""IBM Granite on watsonx.ai: the only AI the app uses.

Five jobs: 1 column meaning, 2 value merges, 3 read a buyer's message,
4 draft the reply, 5 read a question about the records. Every job asks for
JSON, retries once if the answer does not parse, and then falls back to a
plain answer built by code, so the app never stops on a bad response.

MOCK_GRANITE=1 returns the canned answers in fixtures/canned with no
network call. Each call (real or mock) is logged as a GraniteExchange in
the optional `log` list the caller passes in.
"""
import json
import os
import re
import time
from datetime import datetime
from pathlib import Path

CANNED = Path(__file__).resolve().parent.parent / "fixtures" / "canned"
FIELDS = ["lot", "part", "quantity", "time", "machine", "operator", "shift", "step", "alarm", "extra"]
FIELD_HELP = {
    "lot": "lot number: the batch ID that follows parts through the plant",
    "part": "part number: which product, such as B-220",
    "quantity": "quantity: how many pieces were made",
    "time": "time: when the work was done (date and time of production)",
    "machine": "machine: the press, bench or cell that did the work",
    "operator": "operator: the person's ID",
    "shift": "shift: which shift (1st, 2nd, 3, ...)",
    "step": "process step: stamping, deburring, welding, ...",
    "alarm": "machine stop: an alarm or stop code from the machine",
    "extra": "extra detail: anything else (notes, a second date, a log date)",
}
SHOWN = {"lot": "Lot number", "part": "Part number", "quantity": "Quantity", "time": "Time",
         "machine": "Machine", "operator": "Operator", "shift": "Shift", "step": "Process step",
         "alarm": "Machine stop", "extra": "Extra detail"}
PRICE_IN, PRICE_OUT = 0.06 / 1e6, 0.27 / 1e6


def _mock():
    return os.environ.get("MOCK_GRANITE", "1") == "1"


def _model_id():
    return os.environ.get("GRANITE_MODEL_ID", "ibm/granite-4-h-small")


def _canned(name):
    return json.loads((CANNED / name).read_text())


def _now():
    return datetime.now().strftime("%Y-%m-%dT%H:%M")


_client = None


def _model():
    global _client
    if _client is None:
        from ibm_watsonx_ai import Credentials
        from ibm_watsonx_ai.foundation_models import ModelInference
        _client = ModelInference(
            model_id=_model_id(),
            credentials=Credentials(url=os.environ["WATSONX_URL"], api_key=os.environ["WATSONX_APIKEY"]),
            project_id=os.environ["WATSONX_PROJECT_ID"],
            max_retries=1,
        )
    return _client


def _parse(text):
    """Pull the first JSON value out of the answer text."""
    text = (text or "").strip()
    text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.M).strip()
    try:
        return json.loads(text)
    except ValueError:
        m = re.search(r"[\[{].*[\]}]", text, re.S)
        if m:
            try:
                return json.loads(m.group(0))
            except ValueError:
                return None
    return None


def _ask(job, file_id, system, user, schema, log, check, max_tokens=900):
    """Ask Granite for JSON. Try json_schema first, then json_object once
    more if the first answer fails `check`. Returns the parsed value or None."""
    modes = [("json_schema", {"type": "json_schema",
                              "json_schema": {"name": f"job{job}", "schema": schema, "strict": True}}),
             ("json_object", {"type": "json_object"})]
    messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
    for attempt, (mode, fmt) in enumerate(modes):
        started = time.time()
        answer, tin, tout, err = "", 0, 0, None
        try:
            res = _model().chat(messages=messages, params={
                "response_format": fmt, "temperature": 0, "max_tokens": max_tokens})
            answer = res["choices"][0]["message"].get("content") or ""
            usage = res.get("usage") or {}
            tin, tout = usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0)
        except Exception as e:  # network, quota, or a mode the model refuses
            err = f"{type(e).__name__}: {e}"[:300]
        parsed = _parse(answer)
        ok = parsed is not None and check(parsed)
        _log(log, job, file_id, user, answer or err or "", ok, attempt > 0,
             not ok and attempt == len(modes) - 1, mode, tin, tout, time.time() - started)
        if ok:
            return parsed
    return None


def _log(log, job, file_id, sent, answer, parsed, retried, fell_back, mode, tin, tout, seconds):
    if log is None:
        return
    log.append({"exchange_id": f"g{len(log) + 1}", "file_id": file_id, "job": job, "model_id": _model_id(),
                "sent": sent, "answer": answer, "parsed": parsed, "retried": retried, "fell_back": fell_back,
                "output_mode": mode, "tokens_in": tin, "tokens_out": tout, "seconds": round(seconds, 2),
                "at": _now()})


def _mock_log(log, job, file_id, sent, answer):
    _log(log, job, file_id, sent, json.dumps(answer), True, False, False, "json_schema", 0, 0, 0)


def cost(tokens_in, tokens_out):
    return round(tokens_in * PRICE_IN + tokens_out * PRICE_OUT, 6)


# ---------- Job 1: what each column means ----------

LABEL_SYSTEM = (
    "You label the columns of a factory production log. For each column you get its header, "
    "the type detected by code, and up to five sample values. Choose the field it holds from this list:\n"
    + "\n".join(f"- {k}: {v}" for k, v in FIELD_HELP.items())
    + "\nRules: lot, part, quantity, time, machine, operator, shift, step and alarm each fit at most one "
    "column; when two columns could hold the same field, label both and say so in the reason. "
    "Give up to two alternative fields. Set sure to false when the header or samples could mean "
    "something else. Keep each reason under 15 words, in plain words. Answer only with JSON."
)

LABEL_SCHEMA = {
    "type": "object",
    "properties": {"columns": {"type": "array", "items": {
        "type": "object",
        "properties": {"position": {"type": "integer"},
                       "field": {"type": "string", "enum": FIELDS},
                       "alternatives": {"type": "array", "items": {"type": "string", "enum": FIELDS}},
                       "reason": {"type": "string"},
                       "sure": {"type": "boolean"}},
        "required": ["position", "field", "alternatives", "reason", "sure"],
        "additionalProperties": False}}},
    "required": ["columns"], "additionalProperties": False,
}


def _label_user(profiles):
    lines = ["Columns:"]
    for p in profiles:
        lines.append(json.dumps({"position": p["position"], "header": p["header"],
                                 "type": p["detected_type"], "samples": p["samples"][:5]}))
    lines.append('Answer as {"columns": [{"position", "field", "alternatives", "reason", "sure"}]}, '
                 "one item per column, in the same order.")
    return "\n".join(lines)


def _clean_labels(items, profiles):
    by_pos = {}
    for it in items:
        if isinstance(it, dict) and it.get("position") in {p["position"] for p in profiles}:
            field = it.get("field") if it.get("field") in FIELDS else None
            alts = [a for a in (it.get("alternatives") or []) if a in FIELDS and a != field][:2]
            by_pos[it["position"]] = {"position": it["position"], "field": field, "alternatives": alts,
                                      "reason": str(it.get("reason") or "")[:200], "sure": bool(it.get("sure"))}
    return [by_pos.get(p["position"], _no_label(p)) for p in profiles]


def _no_label(p):
    return {"position": p["position"], "field": None, "alternatives": [], "reason": "", "sure": False}


def label_columns(profiles, file_id, log=None):
    """Job 1. Returns (list of LabelProposal, fell_back)."""
    user = _label_user(profiles)
    if _mock():
        canned = _canned("granite_job1.json")
        if [c["position"] for c in canned] == [p["position"] for p in profiles] and len(profiles) == 11:
            _mock_log(log, 1, file_id, user, canned)
            return canned, False
        guess = [_mock_guess(p) for p in profiles]
        _mock_log(log, 1, file_id, user, guess)
        return guess, False
    ok = lambda v: isinstance(v, dict) and isinstance(v.get("columns"), list) and v["columns"]
    parsed = _ask(1, file_id, LABEL_SYSTEM, user, LABEL_SCHEMA, log, ok)
    if parsed is None:
        return [_no_label(p) for p in profiles], True
    return _clean_labels(parsed["columns"], profiles), False


_MOCK_WORDS = [("lot", ("ref", "lot", "batch")), ("part", ("part", "item")), ("quantity", ("qty", "quant", "count")),
               ("time", ("prod", "time", "date", "dt")), ("machine", ("mach", "press", "equip")),
               ("operator", ("op", "oper")), ("shift", ("shift",)), ("step", ("step", "process")),
               ("alarm", ("alarm", "stop", "code"))]


def _mock_guess(p):
    h = re.sub(r"[^a-z]", " ", p["header"].lower()).split()
    for field, words in _MOCK_WORDS:
        if any(w in words for w in h):
            return {"position": p["position"], "field": field, "alternatives": [],
                    "reason": "Header and samples fit.", "sure": True}
    return {"position": p["position"], "field": "extra", "alternatives": [], "reason": "Other detail.", "sure": True}


# ---------- Job 2: values that mean the same thing ----------

MERGE_SYSTEM = (
    "You clean up a column of a factory log. You get the distinct values of one column (machines, process "
    "steps, or part numbers). Find groups of values that are clearly different spellings of the same thing, "
    "such as 'Press 3', 'PRESS-3' and 'P3'. Never group values that could be different things, such as "
    "'Press 1' and 'Press 3'. For each group, give all its values and one clean name taken from the group. "
    "Leave out values that have no other spelling. Answer only with JSON."
)

MERGE_SCHEMA = {
    "type": "object",
    "properties": {"groups": {"type": "array", "items": {
        "type": "object",
        "properties": {"values": {"type": "array", "items": {"type": "string"}}, "name": {"type": "string"}},
        "required": ["values", "name"], "additionalProperties": False}}},
    "required": ["groups"], "additionalProperties": False,
}


def propose_merges(profiles, labels, file_id, log=None):
    """Job 2, only on columns labeled machine, step or part. Returns (list of MergeProposal, fell_back)."""
    wanted = {lb["position"] for lb in labels if lb.get("field") in ("machine", "step", "part")}
    targets = [p for p in profiles if p["position"] in wanted and p.get("distinct")]
    if _mock():
        canned = _canned("granite_job2.json")
        out = [m for m in canned for p in targets
               if m["position"] == p["position"] and set(m["values"]) <= set(p["distinct"])]
        if targets:
            _mock_log(log, 2, file_id, "mock", out)
        return out, False
    out, fell_back = [], False
    ok = lambda v: isinstance(v, dict) and isinstance(v.get("groups"), list)
    for p in targets:
        user = f"Column header: {p['header']}\nDistinct values: {json.dumps(p['distinct'][:200])}"
        parsed = _ask(2, file_id, MERGE_SYSTEM, user, MERGE_SCHEMA, log, ok)
        if parsed is None:
            fell_back = True
            continue
        known = set(p["distinct"])
        for g in parsed["groups"]:
            values = [v for v in dict.fromkeys(g.get("values") or []) if v in known]
            name = g.get("name") if g.get("name") in values else (values[0] if values else None)
            if len(values) >= 2 and name:
                out.append({"position": p["position"], "values": values, "name": name})
    return out, fell_back


# ---------- Job 3: read a buyer's message ----------

READ_SYSTEM = (
    "You read a message from a customer to a parts plant. Find the lot number, the part number, and the "
    "problem the customer describes, in a few words (for example 'burrs'). Copy the lot and part exactly "
    "as written. Use null for anything the message does not say. Answer only with JSON."
)

READ_SCHEMA = {
    "type": "object",
    "properties": {"lot": {"type": ["string", "null"]}, "part": {"type": ["string", "null"]},
                   "problem": {"type": ["string", "null"]}},
    "required": ["lot", "part", "problem"], "additionalProperties": False,
}


def read_request(text, log=None):
    """Job 3. Returns a RequestReading."""
    if _mock():
        lot = re.search(r"\blot\s*#?\s*([A-Za-z0-9-]+)", text, re.I)
        part = re.search(r"\b([A-Z]-\d{3})\b", text)
        reading = {"found": bool(lot), "lot": lot.group(1) if lot else None,
                   "part": part.group(1) if part else None,
                   "problem": "burrs" if "burr" in text.lower() else None, "source": "granite"}
        _mock_log(log, 3, None, text, reading)
        return reading
    ok = lambda v: isinstance(v, dict) and "lot" in v
    parsed = _ask(3, None, READ_SYSTEM, f"Message:\n{text}", READ_SCHEMA, log, ok, max_tokens=200)
    if parsed is None:
        return {"found": False, "lot": None, "part": None, "problem": None, "source": "fallback"}
    lot = str(parsed["lot"]).strip() if parsed.get("lot") else None
    if lot and lot not in text:  # never accept a lot number the message does not contain
        lot = None
    return {"found": bool(lot), "lot": lot, "part": parsed.get("part") or None,
            "problem": parsed.get("problem") or None, "source": "granite"}


# ---------- Job 4: draft the reply ----------

DRAFT_SYSTEM = (
    "You draft the first part of a containment reply (the D3 step of an 8D report) from a parts plant to a "
    "customer. Use only the facts in the records you are given. Never guess a cause, never say a lot is "
    "defective, and never promise an action. Write two short sections in plain words:\n"
    "found: what the records show for this lot (part, machine, time, shift, operator, any machine stop "
    "code, later steps).\n"
    "others: the other lots worth checking, each with its reason, as given. Say they are worth checking, "
    "not defective. If there are none, say no other lots matched the rules.\n"
    "Write times like 'May 4, 2021 at 4:15 PM'. Write stop codes as 'machine stop, code 101'. "
    "Answer only with JSON."
)

DRAFT_SCHEMA = {
    "type": "object",
    "properties": {"found": {"type": "string"}, "others": {"type": "string"}},
    "required": ["found", "others"], "additionalProperties": False,
}

HEADINGS = ["What we found", "Other lots that may be affected", "What we are doing now"]


def _code(alarm):
    digits = "".join(c for c in str(alarm) if c.isdigit())
    return str(int(digits)) if digits else str(alarm)


def _when(t):
    try:
        d = datetime.strptime(t, "%Y-%m-%dT%H:%M")
        return f"{d.strftime('%B')} {d.day}, {d.year} at {d.strftime('%I:%M %p').lstrip('0')}"
    except (TypeError, ValueError):
        return str(t)


def _facts(history, risk):
    found = []
    for e in (history or {}).get("entries", []):
        bits = [f"{e.get('step') or 'Step'} on {e.get('machine') or 'unknown machine'}, {_when(e.get('time'))}"]
        if e.get("shift"):
            bits.append(f"shift {e['shift']}")
        if e.get("operator"):
            bits.append(f"operator {e['operator']}")
        if e.get("alarm"):
            bits.append(f"machine stop, code {_code(e['alarm'])}")
        found.append("- " + ", ".join(bits))
    others = [f"- Lot {lk['lot']}: " + ", ".join(r[0].lower() + r[1:] for r in lk["reasons"])
              for lk in (risk or {}).get("links", [])]
    return found, others


def _sections(found, others):
    return [{"heading": HEADINGS[0], "text": found}, {"heading": HEADINGS[1], "text": others},
            {"heading": HEADINGS[2], "text": ""}]


def draft_reply(reading, history, risk, log=None):
    """Job 4. Returns a Draft. The third section is always empty."""
    found, others = _facts(history, risk)
    fallback = {"source": "fallback",
                "sections": _sections("\n".join(found), "\n".join(others) or "- No other lots matched the rules.")}
    if not history:
        return fallback
    if _mock():
        canned = _canned("granite_job4.json")
        _mock_log(log, 4, None, "mock", canned)
        return canned
    lot = history["lot"]
    user = (f"Customer's message says: {json.dumps(reading or {})}\n"
            f"Lot {lot}, part {history.get('part')}. Records for this lot:\n" + "\n".join(found)
            + "\nOther lots worth checking (rules, not verdicts):\n" + ("\n".join(others) or "none"))
    ok = lambda v: isinstance(v, dict) and v.get("found") and "others" in v
    parsed = _ask(4, None, DRAFT_SYSTEM, user, DRAFT_SCHEMA, log, ok, max_tokens=600)
    if parsed is None:
        return fallback
    return {"source": "granite", "sections": _sections(parsed["found"].strip(), parsed["others"].strip())}


# ---------- Job 5: a question about the records (only if the deadline allows) ----------

def ask_records(question, options, log=None):
    """Job 5. Not built for Friday; returns the canned reading in mock mode, else nothing found."""
    if _mock():
        return _canned("records_question.json")
    return {"found": False, "filters": {}, "sentence": "Could not read that question.", "source": "fallback"}
