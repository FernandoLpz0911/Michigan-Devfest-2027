import pytest
from backend.store import (connect, save_entries, save_held, lot_history, all_entries, held_rows,
                           lot_numbers, save_exchange, exchanges, save_counters, get_counters)


def entry(fid, row, lot, time, fname):
    return {"entry_id": f"{fid}-r{row}", "lot": lot, "time": time, "source_file": fname,
            "file_id": fid, "source_row": row, "extra": {}, "changed": []}


@pytest.fixture
def con(tmp_path):
    return connect(str(tmp_path / "w.db"))


def test_history_across_files_in_time_order(con):
    save_entries(con, [entry("f2", 3, "4417", "2021-05-07T09:00", "b.csv"),
                       entry("f1", 8, "4417", "2021-05-04T16:15", "a.csv"),
                       entry("f1", 9, "4420", "2021-05-04T18:16", "a.csv")])
    h = lot_history(con, "4417")
    assert h["lot"] == "4417" and [e["entry_id"] for e in h["entries"]] == ["f1-r8", "f2-r3"]
    assert lot_history(con, "9999") is None
    assert lot_numbers(con) == ["4417", "4420"] and len(all_entries(con)) == 3


def test_resave_replaces(con):
    save_entries(con, [entry("f1", 1, "1", "2021-05-04T10:00", "a.csv")])
    save_entries(con, [entry("f1", 1, "2", "2021-05-04T10:00", "a.csv")])
    assert lot_numbers(con) == ["2"]


def test_held_exchanges_counters(con):
    save_held(con, [{"file_id": "f1", "source_file": "a.csv", "source_row": 31, "original_row": {},
                     "reason": "no_lot", "reason_text": "No lot number"}])
    assert held_rows(con)[0]["source_row"] == 31
    save_exchange(con, {"exchange_id": "g1", "file_id": "f1", "job": 1})
    save_exchange(con, {"exchange_id": "g2", "file_id": "f1", "job": 2})
    save_exchange(con, {"exchange_id": "g3", "file_id": None, "job": 3})
    assert [x["exchange_id"] for x in exchanges(con, "f1")] == ["g1", "g2"]
    assert get_counters(con, "f1") is None
    save_counters(con, "f1", {"entries": 1})
    save_counters(con, "f1", {"entries": 2})
    assert get_counters(con, "f1") == {"entries": 2}
