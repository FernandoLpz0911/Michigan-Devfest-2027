"""End-to-end: the three shift files go through the real routes (Granite mocked)."""
import importlib
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

FIX = Path(__file__).resolve().parent.parent / "fixtures"


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


def upload(client, name):
    with open(FIX / name, "rb") as f:
        return client.post("/api/files", files={"file": (name, f)})


def test_full_demo_flow(client):
    r = upload(client, "shift1_log.csv").json()
    assert r["status"] == "needs_check" and not r["recognized"]
    kinds = [q["kind"] for q in r["questions"]]
    assert sorted(kinds) == ["duplicate", "merge", "unsure"]
    answers = []
    for q in r["questions"]:
        value = q["preselected"] or ("3" if q["kind"] == "duplicate" else "yes")
        answers.append({"question_id": q["question_id"], "value": value})
    saved = client.post(f"/api/files/{r['file_id']}/answers", json={"answers": answers}).json()
    assert saved["entries"] + saved["held"] == saved["data_rows"] == 83
    assert saved["held"] == 1

    r2 = upload(client, "shift2_export.csv").json()
    assert r2["recognized"] and r2["status"] == "ready" and r2["questions"] == []
    r3 = upload(client, "shift3.xlsx").json()
    assert r3["recognized"] and r3["new_columns"] == ["Comments"]

    detail = client.get(f"/api/files/{r3['file_id']}/detail").json()
    assert detail["counters"]["unseen_values"] == [{"field": "machine", "value": "Press1", "count": 1}]

    rows = client.get("/api/files").json()
    assert [x["status"] for x in rows] == ["ready"] * 3
    assert sum(x["entries"] for x in rows) == 217 and sum(x["held"] for x in rows) == 2

    ans = client.post("/api/find", json={"text": "4417"}).json()
    assert ans["reading"]["source"] == "typed"
    assert ans["history"]["part"] == "B-220"
    assert [e["machine"] for e in ans["history"]["entries"]][0] == "Press 3"
    assert len(ans["links"]) == 8 and ans["lots_in_week"] == 140

    msg = (FIX / "buyer_message.txt").read_text()
    ans = client.post("/api/find", json={"text": msg}).json()
    assert ans["reading"]["lot"] == "4417" and ans["history"]

    draft = client.post("/api/draft", json={"lot": "4417", "reading": ans["reading"]}).json()
    assert [s["heading"] for s in draft["sections"]][2] == "What we are doing now"

    miss = client.post("/api/find", json={"text": "4471x"}).json()
    assert miss["history"] is None and len(miss["closest"]) == 3

    # Any value in the files works, not only a lot number: machine, part, alarm code.
    for text in ("Press 3", "press 3", "B-220", "A_101"):
        hit = client.post("/api/find", json={"text": text}).json()
        assert hit["matches"]["total"] > 0 and hit["history"] is None, text
        assert all(r["lot"] and r["where"] for r in hit["matches"]["rows"])
    b220 = client.post("/api/find", json={"text": "B-220"}).json()["matches"]
    assert "4417" in [r["lot"] for r in b220["rows"]] or b220["total"] > len(b220["rows"])

    tl = client.get("/api/timeline/4417").json()
    assert tl["machine"] == "Press 3" and len(tl["lots"]) == 6
    assert client.get("/api/timeline/9999").status_code == 404

    assert len(client.get("/api/held").json()) == 2
    page = client.get("/api/records", params={"machine": "Press 3", "stop": "A_101"}).json()
    assert page["matching"] >= 2
    assert client.get("/api/records.csv").headers["content-type"].startswith("text/csv")
    view = client.get(f"/api/files/{r['file_id']}/view").json()
    assert view["rows"] and view["columns"]
    # A recognized file with different header spelling still shows what each column became.
    v2 = client.get(f"/api/files/{r2['file_id']}/view").json()
    fields2 = {c["header"]: c["field"] for c in v2["columns"]}
    assert fields2["REF"] == "lot" and fields2["MACH"] == "machine"
    first = next(x for x in v2["rows"] if x["kind"] == "entry")
    assert first["clean"][0] == first["raw"][0]
    assert client.get(f"/api/files/{r['file_id']}/status").json()["status"] == "ready"
    assert client.get(f"/api/files/{r['file_id']}/granite").json()

    # Deleting one file removes its rows and records, and only those.
    assert client.delete(f"/api/files/{r3['file_id']}").json() == {"deleted": r3["file_id"]}
    rows = client.get("/api/files").json()
    assert r3["file_id"] not in [x["file_id"] for x in rows] and len(rows) == 2
    assert client.get("/api/records").json()["total"] == sum(x["entries"] for x in rows) < 217
    assert client.delete(f"/api/files/{r3['file_id']}").status_code == 404


def test_errors_have_message_and_fix(client):
    bad = client.post("/api/files", files={"file": ("notes.txt", b"hello")})
    assert bad.status_code == 400 and set(bad.json()["error"]) == {"message", "fix"}
    gone = client.get("/api/files/f999/status")
    assert gone.status_code == 404 and "fix" in gone.json()["error"]


def test_settings_round_trip(client):
    assert client.get("/api/settings").json() == {"window_hours": 4, "hand_time_minutes": None}
    assert client.put("/api/settings", json={"hand_time_minutes": 45}).json()["hand_time_minutes"] == 45
