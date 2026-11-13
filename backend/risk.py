from datetime import datetime, timedelta

RULE_ORDER = ["same_machine_window", "same_stop", "same_operator_shift"]


def _t(text):
    return datetime.strptime(text, "%Y-%m-%dT%H:%M")


def _same(a, b):
    return a is not None and a == b


def _minutes_text(m):
    if m < 60:
        return f"{m} minute" + ("" if m == 1 else "s")
    h = m // 60
    return f"{h} hour" + ("" if h == 1 else "s")


def find_links(lot: str, entries: list[dict], window_hours: float = 4) -> dict:
    mine = [e for e in entries if e["lot"] == lot and e["time"]]
    if not mine:
        return {"links": [], "lots_in_week": 0}

    first = _t(min(e["time"] for e in mine))
    monday = (first - timedelta(days=first.weekday())).replace(hour=0, minute=0)
    week_end = monday + timedelta(days=7)
    lots_in_week = len({e["lot"] for e in entries
                        if e["lot"] is not None and e["time"]
                        and monday <= _t(e["time"]) < week_end})

    found = {}  # other lot -> {"rules": {rule: (gap, reason)}, "best": (gap, entry)}

    def note(other, rule, gap, reason):
        slot = found.setdefault(other["lot"], {"rules": {}, "best": (gap, other)})
        if rule not in slot["rules"] or gap < slot["rules"][rule][0]:
            slot["rules"][rule] = (gap, reason)
        if gap < slot["best"][0]:
            slot["best"] = (gap, other)

    for o in entries:
        if o["lot"] is None or o["lot"] == lot or not o["time"]:
            continue
        for m in mine:
            gap_delta = abs(_t(o["time"]) - _t(m["time"]))
            gap = int(gap_delta.total_seconds() // 60)
            same_day = _t(o["time"]).date() == _t(m["time"]).date()
            same_machine = _same(m["machine"], o["machine"])

            if same_machine and gap <= window_hours * 60:
                when = "later" if _t(o["time"]) >= _t(m["time"]) else "earlier"
                note(o, "same_machine_window", gap, f"Same machine, {_minutes_text(gap)} {when}")

            if same_machine and _same(m["alarm"], o["alarm"]) and same_day:
                note(o, "same_stop", gap, f"Same machine stop, code {int(''.join(c for c in m['alarm'] if c.isdigit()) or 0)}")

            if (_same(m["operator"], o["operator"]) and _same(m["shift"], o["shift"])
                    and same_day):
                note(o, "same_operator_shift", gap, "Same operator and shift, same day")

    links = []
    for other, slot in found.items():
        rules = [r for r in RULE_ORDER if r in slot["rules"]]
        _, best = slot["best"]
        links.append({
            "lot": other,
            "part": best["part"],
            "machine": best["machine"],
            "time": best["time"],
            "rules": rules,
            "reasons": [slot["rules"][r][1] for r in rules],
            "closeness_minutes": slot["best"][0],
        })
    links.sort(key=lambda link: (link["closeness_minutes"], link["lot"]))
    return {"links": links, "lots_in_week": lots_in_week}
