import pytest
from backend.store import connect, save_entries
from backend.timeline import lot_timeline
from backend.pipeline import UserError


def E(lot, time, machine="Press 3", operator=None, shift=None, alarm=None, n=[0]):
    n[0] += 1
    return {"entry_id": f"t{n[0]}", "lot": lot, "part": "P", "time": time, "machine": machine,
            "operator": operator, "shift": shift, "alarm": alarm, "source_file": "a.csv", "source_row": n[0]}


@pytest.fixture
def con(tmp_path):
    return connect(str(tmp_path / "w.db"))


def test_shape_roles_stops_and_times(con):
    save_entries(con, [E("1", "2021-05-04T10:00", alarm="A_005"), E("2", "2021-05-04T11:00"),
                       E("3", "2021-05-04T20:00"), E("4", "2021-05-05T10:00"),
                       E("5", "2021-05-04T10:30", machine="Press 9")])
    t = lot_timeline(con, "1", 4)
    assert (t["lot"], t["machine"], t["day"]) == ("1", "Press 3", "2021-05-04")
    assert [(l["lot"], l["role"]) for l in t["lots"]] == [("1", "this"), ("2", "worth_checking"), ("3", "other")]
    assert t["lots"][0]["start"] == "2021-05-04T10:00" and t["lots"][0]["end"] == "2021-05-04T11:00"
    assert t["lots"][1]["end"] == "2021-05-04T13:00"
    assert t["stops"] == [{"time": "2021-05-04T10:00", "code": "A_005"}]


def test_operator_shift_only_is_not_worth_checking(con):
    save_entries(con, [E("1", "2021-05-04T06:00", operator="Ann", shift="1st"),
                       E("2", "2021-05-04T14:00", operator="Ann", shift="1st")])
    assert [l["role"] for l in lot_timeline(con, "1", 4)["lots"]] == ["this", "other"]


def test_alone_on_machine(con):
    save_entries(con, [E("1", "2021-05-04T10:00")])
    assert [l["lot"] for l in lot_timeline(con, "1", 4)["lots"]] == ["1"]


def test_unknown_lot(con):
    with pytest.raises(UserError) as e:
        lot_timeline(con, "9", 4)
    assert e.value.status == 404
