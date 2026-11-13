"""Turn Granite's proposals into the questions of design doc 7.2."""

SHOWN = {"lot": "Lot number", "part": "Part number", "quantity": "Quantity", "time": "Time",
         "machine": "Machine", "operator": "Operator", "shift": "Shift", "step": "Process step",
         "alarm": "Machine stop", "extra": "Something else"}
NAMED = {"lot": "the lot number", "part": "the part number", "quantity": "the quantity", "time": "the time",
         "machine": "the machine", "operator": "the operator", "shift": "the shift",
         "step": "the process step", "alarm": "the machine stop", "extra": "extra detail"}
ONE_COLUMN = [k for k in SHOWN if k != "extra"]
NO_GUESS = {"date": ["time", "extra"], "number": ["lot", "quantity", "part", "extra"],
            "text": ["part", "machine", "step", "extra"]}
TYPE_WORD = {"date": "dates", "number": "numbers", "text": "text"}


def _choice(value, text, samples=(), guess=False):
    return {"value": value, "text": text, "samples": list(samples), "granite_guess": guess}


def _field_choices(guess, alternatives, samples):
    """Guess first, up to two alternatives, then 'Something else'. Never more than four."""
    keys = [guess] if guess else []
    keys += [a for a in alternatives[:2] if a not in keys and a != "extra"]
    keys = [k for k in keys if k != "extra"][:3] + ["extra"]
    return [_choice(k, SHOWN[k], samples if k == guess else [], k == guess) for k in keys]


def _fallback_question(profile):
    keys = NO_GUESS[profile["detected_type"]][:4]
    return {"kind": "unsure", "positions": [profile["position"]], "title": "What is this column?",
            "sentence": "Granite could not read this column. Pick what it is.",
            "choices": [_choice(k, SHOWN[k], profile["samples"] if i == 0 else []) for i, k in enumerate(keys)],
            "preselected": None}


def _missing_question(field, profiles, by_pos):
    wanted = "date" if field == "time" else None
    free = [p for p in profiles if by_pos.get(p["position"], {}).get("field") in (None, "extra")]
    free.sort(key=lambda p: (wanted is not None and p["detected_type"] != wanted, p["position"]))
    choices = [_choice(str(p["position"]), p["header"], p["samples"]) for p in free[:3]]
    choices.append(_choice("none", "None of these"))
    return {"kind": "missing", "positions": [p["position"] for p in free[:3]],
            "title": "Which column is %s?" % NAMED[field], "sentence": "None was found.",
            "choices": choices, "preselected": None}


def build_questions(profiles, labels, merges, fell_back):
    by_pos = {l["position"]: l for l in labels}
    if fell_back:
        qs = [_fallback_question(p) for p in profiles]
        for i, q in enumerate(qs, 1):
            q["question_id"] = "q%d" % i
        return {"questions": qs, "matched": []}

    prof = {p["position"]: p for p in profiles}
    consumed, questions = set(), []

    # missing: no column labeled lot or time
    used = {l["field"] for l in labels}
    for field in ("lot", "time"):
        if field not in used:
            questions.append(_missing_question(field, profiles, by_pos))

    # duplicate: two columns claim a one-column field
    for field in ONE_COLUMN:
        cols = sorted(l["position"] for l in labels if l["field"] == field and l["position"] in prof)
        if len(cols) > 1:
            consumed.update(cols)
            questions.append({
                "kind": "duplicate", "positions": cols, "title": "Which one is %s?" % NAMED[field]
                if field != "time" else "Which one is the time?",
                "sentence": "Two columns look like %s. Pick the one that fits." % NAMED[field],
                # "None of these" lets the user say no column fits; every listed column then becomes extra.
                "choices": [_choice(str(c), prof[c]["header"], prof[c]["samples"]) for c in cols[:3]]
                           + [_choice("none", "None of these")],
                "preselected": None})

    # type conflict, then unsure
    for kind in ("type_conflict", "unsure"):
        for l in sorted(labels, key=lambda l: l["position"]):
            p = prof.get(l["position"])
            if p is None or l["position"] in consumed or l["field"] is None:
                continue
            f, t = l["field"], p["detected_type"]
            conflict = (f == "time" and t != "date") or (f == "quantity" and t != "number")
            if kind == "type_conflict" and conflict:
                expect = "dates" if f == "time" else "numbers"
                sentence = "Granite says this is %s, but its values are %s, not %s." % (NAMED[f], TYPE_WORD[t], expect)
                pre = None
            elif kind == "unsure" and not conflict and not l["sure"]:
                sentence = "Granite thinks this is %s but isn't sure." % NAMED[f]
                pre = f
            else:
                continue
            consumed.add(l["position"])
            questions.append({"kind": kind, "positions": [l["position"]], "title": "What is this column?",
                              "sentence": sentence,
                              "choices": _field_choices(f, l["alternatives"], p["samples"]), "preselected": pre})

    # merge (the column stays out of matched too)
    merged = set()
    for m in sorted(merges, key=lambda m: m["position"]):
        if len(m["values"]) < 2 or m["position"] not in prof:
            continue
        merged.add(m["position"])
        f = by_pos.get(m["position"], {}).get("field")
        what = NAMED.get(f, "value").replace("the ", "")
        questions.append({
            "kind": "merge", "positions": [m["position"]], "title": "Are these the same?",
            "sentence": "Granite thinks these spellings are the same %s." % what,
            "choices": [_choice("yes", 'Yes, all are "%s"' % m["name"], m["values"], True),
                        _choice("no", "No, keep them apart")],
            "preselected": "yes"})

    for i, q in enumerate(questions, 1):
        q["question_id"] = "q%d" % i
    matched = [{"position": p["position"], "header": p["header"], "field": by_pos[p["position"]]["field"],
                "decided_by": "granite"}
               for p in profiles if p["position"] in by_pos and by_pos[p["position"]]["field"]
               and p["position"] not in consumed and p["position"] not in merged
               and not any(p["position"] in q["positions"] for q in questions)]
    return {"questions": questions, "matched": matched}
