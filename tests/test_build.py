import pytest
from backend.build import build_entries, normalize_time

HEADERS = ["Ref", "Part", "Qty", "Prod Dt", "Mach", "Alarm", "Notes"]
FMT = {"format_id": "fmt1", "name": "x.csv", "headers": HEADERS,
       "mapping": {"Ref": "lot", "Part": "part", "Qty": "quantity", "Prod Dt": "time",
                   "Mach": "machine", "Alarm": "alarm", "Notes": "extra"},
       "value_rules": {"machine": {"PRESS-3": "Press 3", "P3": "Press 3"}},
       "created_at": "2026-11-13T11:02"}


def table(rows, start=5):
    return {"source_file": "x.csv", "header_row": start - 1, "skipped": [], "headers": HEADERS,
            "rows": rows, "source_rows": list(range(start, start + len(rows)))}


@pytest.mark.parametrize("text,want", [
    ("5/4/21 4:15p", "2021-05-04T16:15"), ("5/4/21 4:15 PM", "2021-05-04T16:15"),
    ("5/4/2021 16:15", "2021-05-04T16:15"), ("2021-05-04 14:02", "2021-05-04T14:02"),
    ("2021-05-04T14:02", "2021-05-04T14:02"), ("2021-05-04", "2021-05-04T00:00"),
    ("04-May-2021 22:10", "2021-05-04T22:10"), ("4-May-21 22:10", "2021-05-04T22:10"),
    ("5/3/21 6:01a", "2021-05-03T06:01"), ("5/3/21 12:00p", "2021-05-03T12:00"),
    ("2021-05-04 14:02:28.907000+00:00", "2021-05-04T14:02"), ("2021-05-04T14:02:28Z", "2021-05-04T14:02"),
    ("2021-05-04 14:02:28", "2021-05-04T14:02"), ("2021-05-04 14:02:28.5-05:00", "2021-05-04T14:02"),
    ("1620000658.677", "2021-05-03T00:10"), ("??", None), ("", None)])
def test_normalize_time(text, want):
    assert normalize_time(text) == want


def test_build_merge_hold_and_unseen():
    rows = [["4384", "B-118", "5699", "5/3/21 6:01a", "P3", "A_065", ""],
            ["4385", "B-305", "x", "5/3/21 6:08a", "Press 3", "", "n"],
            ["", "B-118", "1", "5/3/21 6:08a", "Press 3", "", ""],
            ["4386", "B-118", "1", "??", "Press 3", "", ""],
            ["", "", "", "", "", "", ""],
            ["4387", "B-1", "2", "2021-05-03 08:00", "Press1", "", ""],
            ["4388", "B-1", "2", "2021-05-03 08:00", "Press1", "", ""]]
    r = build_entries(table(rows), FMT, "f1")
    assert len(r["entries"]) + len(r["held"]) == len(rows)
    assert [h["reason"] for h in r["held"]] == ["no_lot", "bad_time", "empty"]
    assert r["held"][0]["reason_text"] == "No lot number" and r["held"][2]["source_row"] == 9
    e = r["entries"][0]
    assert e["entry_id"] == "f1-r5" and e["machine"] == "Press 3" and e["quantity"] == 5699
    assert e["time"] == "2021-05-03T06:01" and e["alarm"] == "A_065"
    assert e["changed"] == ["time", "machine"] and e["original_row"]["Mach"] == "P3"
    assert e["extra"] == {"Notes": ""} and e["step"] is None and e["file_id"] == "f1"
    e2 = r["entries"][1]
    assert e2["quantity"] is None and e2["original_row"]["Qty"] == "x" and e2["alarm"] is None
    assert r["values_cleaned"] == 1
    assert r["unseen_values"] == [{"field": "machine", "value": "Press1", "count": 2}]


def test_machine_log_without_lot_column_keeps_rows():
    fmt = {**FMT, "mapping": {**FMT["mapping"], "Ref": "extra"}}
    rows = [["", "B-118", "1", "5/3/21 6:08a", "Press 3", "A_074", ""],
            ["", "B-118", "1", "??", "Press 3", "", ""]]
    r = build_entries(table(rows), fmt, "f1")
    assert [e["lot"] for e in r["entries"]] == [None]
    assert r["entries"][0]["alarm"] == "A_074"
    assert [h["reason"] for h in r["held"]] == ["bad_time"]
