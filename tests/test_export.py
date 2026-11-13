import importlib
import io
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from openpyxl import load_workbook
from openpyxl.styles import Font

from backend.export import cleaned_file
from tests.test_fileview import ENTRIES, FMT, HELD, MATCHED, TABLE

FIX = Path(__file__).resolve().parent.parent / "fixtures"


def make(**o):
    return cleaned_file(TABLE, FMT, MATCHED, ENTRIES, HELD, "f1", o)


def test_csv_default_iso_no_held():
    data, name, kind = make()
    assert name == "a_cleaned.csv" and kind == "text/csv"
    lines = data.decode().splitlines()
    assert lines[0] == "Lot number,Time,Machine,Notes"
    assert lines[1] == "4384,2021-05-03 06:01,Press 3,hi" and len(lines) == 2


def test_us_dates():
    assert "05/03/2021 6:01 AM" in make(dates="us")[0].decode()


def test_held_rows_added_with_reason():
    lines = make(held=True)[0].decode().splitlines()
    assert lines[0].endswith(",Held back because") and lines[2] == ",5/3/21 7:00a,P3,,No lot number"
    assert lines[1].endswith(",")


def test_filter_limits_rows():
    assert len(make(q="zzz")[0].decode().splitlines()) == 1
    assert len(make(held=True, kind="held")[0].decode().splitlines()) == 2


def test_xlsx_bold_header():
    data, name, kind = make(format="xlsx", held=True)
    assert name == "a_cleaned.xlsx" and "spreadsheetml" in kind
    ws = load_workbook(io.BytesIO(data)).active
    assert ws["A1"].font.bold and not ws["A2"].font.bold
    assert ws["B2"].value == "2021-05-03 06:01" and ws["E3"].value == "No lot number"


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    mp = pytest.MonkeyPatch()
    mp.setenv("DATA_DIR", str(tmp_path_factory.mktemp("data")))
    mp.setenv("MOCK_GRANITE", "1")
    from backend import pipeline, main
    pipeline._con = None
    importlib.reload(main)
    yield TestClient(main.app)
    pipeline._con = None
    mp.undo()


def test_routes(client):
    with open(FIX / "shift1_log.csv", "rb") as f:
        r = client.post("/api/files", files={"file": ("shift1_log.csv", f)}).json()
    fid = r["file_id"]
    answers = [{"question_id": q["question_id"],
                "value": q["preselected"] or ("3" if q["kind"] == "duplicate" else "yes")} for q in r["questions"]]
    client.post(f"/api/files/{fid}/answers", json={"answers": answers})
    orig = client.get(f"/api/files/{fid}/download?version=original&format=xlsx")
    assert orig.content == (FIX / "shift1_log.csv").read_bytes()
    assert 'attachment; filename="shift1_log.csv"' == orig.headers["content-disposition"]
    c = client.get(f"/api/files/{fid}/download")
    assert c.status_code == 200 and "shift1_log_cleaned.csv" in c.headers["content-disposition"]
    n_all = len(c.text.splitlines())
    one = client.get(f"/api/files/{fid}/download?q=zzzzqq")
    assert len(one.text.splitlines()) == 1 and n_all > 2
    held = client.get(f"/api/files/{fid}/download?held=true&format=xlsx&dates=us")
    assert held.status_code == 200 and "spreadsheetml" in held.headers["content-type"]
    v = client.get(f"/api/files/{fid}/view?kind=held").json()
    assert v["matching"] == len(v["rows"]) - 1
    assert client.get("/api/files/f999/download").status_code == 404
    assert client.get("/api/files/f999/download?version=original").status_code == 404


def test_attachment_header_handles_odd_names():
    from backend.main import _attachment
    h = _attachment('Schicht "Ü".csv')
    assert h.startswith('attachment; filename="Schicht ___.csv"')
    assert "filename*=UTF-8''Schicht%20%22%C3%9C%22.csv" in h
    h.encode("latin-1")
