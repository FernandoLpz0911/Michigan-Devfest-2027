import pytest

from backend import granite

PIADE_HEADERS = ["interval_start", "equipment_ID", "alarm", "type", "start", "end", "elapsed", "pi", "po", "speed"]
PIADE_TYPES = ["text", "text", "text", "text", "number", "number", "number", "number", "number", "number"]
PIADE_ROW = ["2020-01-01 11:21:28.907000+00:00", "s_1", "A_000", "scheduled_downtime",
             "1577877688.907", "1577877751.957", "63050", "59916598", "59517799", "0"]
MACHINE_STYLE = ["start", "end", "elapsed", "pi", "po", "speed"]


def profiles(headers, types, samples):
    return [{"position": i, "header": h, "detected_type": t, "samples": s,
             "distinct": None if t != "text" else list(s)}
            for i, (h, t, s) in enumerate(zip(headers, types, samples))]


@pytest.fixture(autouse=True)
def mock(monkeypatch):
    monkeypatch.setenv("MOCK_GRANITE", "1")


def by_header(headers, types, samples):
    labels, fell_back = granite.label_columns(profiles(headers, types, samples), "f1")
    assert not fell_back
    return {headers[l["position"]]: l for l in labels}


def confident(label, fields=("quantity", "part", "time")):
    return label["field"] in fields and label["sure"]


def test_piade_machine_columns_not_confident():
    got = by_header(PIADE_HEADERS, PIADE_TYPES, [[v] for v in PIADE_ROW])
    for h in MACHINE_STYLE:
        assert not confident(got[h]), h


def test_piade_known_columns_still_confident():
    got = by_header(PIADE_HEADERS, PIADE_TYPES, [[v] for v in PIADE_ROW])
    assert (got["interval_start"]["field"], got["interval_start"]["sure"]) == ("time", True)
    assert (got["equipment_ID"]["field"], got["equipment_ID"]["sure"]) == ("machine", True)
    assert (got["alarm"]["field"], got["alarm"]["sure"]) == ("alarm", True)


def test_tempting_headers_are_asked_not_guessed():
    got = by_header(["Count", "Run Time", "Part"], ["number", "number", "number"],
                    [["1577877688", "1577877751"], ["63050", "120"], ["59916598", "59917001", "59918410"]])
    for h in ("Count", "Run Time", "Part"):
        assert not confident(got[h]), h
        assert got[h]["sure"] is False and got[h]["field"] == "extra"
        assert got[h]["alternatives"]


def test_plain_quantity_still_confident():
    got = by_header(["Qty"], ["number"], [["12", "40", "8"]])
    assert (got["Qty"]["field"], got["Qty"]["sure"]) == ("quantity", True)


def test_prompt_names_machine_readings():
    for word in ("Unix", "counter", "speed", "duration"):
        assert word in granite.LABEL_SYSTEM
