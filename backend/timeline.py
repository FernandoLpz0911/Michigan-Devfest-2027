"""Lot timeline: every lot on one machine on one day, with stops and which lots are worth checking."""
from datetime import timedelta

from . import risk, store

BLOCK = timedelta(hours=2)
WORTH = {"same_machine_window", "same_stop"}


def lot_timeline(con, lot, window_hours):
    from .pipeline import UserError
    entries = store.all_entries(con)
    mine = [e for e in entries if e["lot"] == lot and e.get("time") and e.get("machine")]
    if not mine:
        raise UserError("No machine records were found for that lot.", "Check the lot number and try again.", 404)
    first = min(mine, key=lambda e: e["time"])
    machine, day = first["machine"], first["time"][:10]

    same = sorted((e for e in entries if e.get("time") and e.get("machine") == machine
                   and e["time"][:10] == day and e["lot"] is not None), key=lambda e: e["time"])
    worth = {l["lot"] for l in risk.find_links(lot, entries, window_hours)["links"] if WORTH & set(l["rules"])}

    blocks = {}
    for i, e in enumerate(same):
        start = risk._t(e["time"])
        end = start + BLOCK
        later = [risk._t(n["time"]) for n in same[i + 1:] if n["time"] > e["time"]]
        if later:
            end = min(end, later[0])
        b = blocks.setdefault(e["lot"], [start, end])
        b[0], b[1] = min(b[0], start), max(b[1], end)

    fmt = "%Y-%m-%dT%H:%M"
    lots = [{"lot": n, "start": s.strftime(fmt), "end": en.strftime(fmt),
             "role": "this" if n == lot else "worth_checking" if n in worth else "other"}
            for n, (s, en) in sorted(blocks.items(), key=lambda kv: (kv[1][0], kv[0]))]
    stops = [{"time": e["time"], "code": e["alarm"]} for e in same if e.get("alarm")]
    return {"lot": lot, "machine": machine, "day": day, "lots": lots, "stops": stops}
