import csv
import io
import pytest
from backend import store
from backend.records import query_records, records_csv

NONE = dict(q=None, machine=None, shift=None, date_from=None, date_to=None, stop=None,
            only_cleaned=False, only_held=False)


def entry(n, lot, time, machine="Press 3", shift="1st", alarm=None, changed=(), part="B-220", op="OP-114"):
    return {"entry_id": f"f1-r{n}", "lot": lot, "part": part, "quantity": 5, "time": time, "machine": machine,
            "operator": op, "shift": shift, "step": "Stamping", "alarm": alarm, "extra": {},
            "source_file": "a.csv", "file_id": "f1", "source_row": n, "original_row": {"Lot": lot},
            "changed": list(changed)}


@pytest.fixture
def con(tmp_path):
    c = store.connect(str(tmp_path / "t.db"))
    store.save_entries(c, [
        entry(1, "4417", "2021-05-04T16:15", alarm="A_101", changed=["machine"]),
        entry(2, "4420", "2021-05-04T18:16", alarm="A_101"),
        entry(3, "4421", "2021-05-05T09:00", machine="Press 1", shift="2nd", part="D-040", op="OP-9"),
        entry(4, "4422", "2021-05-06T09:00", alarm="A_007", changed=["time"]),
    ])
    store.save_held(c, [{"file_id": "f1", "source_file": "a.csv", "source_row": 31,
                         "original_row": {"Lot": ""}, "reason": "no_lot", "reason_text": "No lot number"}])
    return c


def lots(page):
    return [r["lot"] for r in page["rows"]]


def f(**kw):
    return {**NONE, **kw}


def test_no_filters_shape(con):
    p = query_records(con, f(), 1)
    assert (p["total"], p["matching"], p["page"], p["page_size"]) == (4, 4, 1, 50)
    assert p["options"] == {"machine": ["Press 1", "Press 3"], "shift": ["1st", "2nd"],
                            "stop": ["A_007", "A_101"], "date_min": "2021-05-04", "date_max": "2021-05-06"}
    assert p["filters"] == f()


def test_each_filter(con):
    assert lots(query_records(con, f(machine="Press 1"), 1)) == ["4421"]
    assert lots(query_records(con, f(shift="2nd"), 1)) == ["4421"]
    assert lots(query_records(con, f(stop="A_101"), 1)) == ["4417", "4420"]
    assert lots(query_records(con, f(date_from="2021-05-05"), 1)) == ["4421", "4422"]
    assert lots(query_records(con, f(date_to="2021-05-04"), 1)) == ["4417", "4420"]
    assert lots(query_records(con, f(q="d-040"), 1)) == ["4421"]
    assert lots(query_records(con, f(q="op-9"), 1)) == ["4421"]
    assert lots(query_records(con, f(q="442"), 1)) == ["4420", "4421", "4422"]
    assert lots(query_records(con, f(only_cleaned=True), 1)) == ["4417", "4422"]


def test_filters_combine(con):
    p = query_records(con, f(machine="Press 3", stop="A_101", date_from="2021-05-04", date_to="2021-05-04"), 1)
    assert lots(p) == ["4417", "4420"] and p["matching"] == 2 and p["total"] == 4
    assert lots(query_records(con, f(machine="Press 3", only_cleaned=True, q="4422"), 1)) == ["4422"]


def test_only_held(con):
    p = query_records(con, f(only_held=True), 1)
    assert p["matching"] == 1 and p["rows"][0]["reason"] == "no_lot"


def test_paging(tmp_path):
    c = store.connect(str(tmp_path / "p.db"))
    store.save_entries(c, [entry(i, f"L{i:03}", f"2021-05-04T10:{i % 60:02}") for i in range(1, 121)])
    assert len(query_records(c, f(), 1)["rows"]) == 50
    assert len(query_records(c, f(), 3)["rows"]) == 20
    assert query_records(c, f(), 3)["matching"] == 120


def test_csv_matches_filter(con):
    rows = list(csv.reader(io.StringIO(records_csv(con, f(stop="A_101")))))
    assert rows[0][0] == "Lot number" and [r[0] for r in rows[1:]] == ["4417", "4420"]
    assert len(list(csv.reader(io.StringIO(records_csv(con, f()))))) == 5
