import json
from pathlib import Path

from fastapi.testclient import TestClient

from backend.main import app

C = Path(__file__).resolve().parent.parent / "fixtures" / "canned"
client = TestClient(app)


def canned(name):
    return json.loads((C / name).read_text())


def test_get_routes():
    for path, name in [
        ("/api/files", "file_rows.json"),
        ("/api/files/f1/status", "file_status.json"),
        ("/api/files/f1/detail", "file_detail.json"),
        ("/api/files/f1/granite", "granite_exchanges.json"),
        ("/api/files/f1/view", "file_view.json"),
        ("/api/held", "held_rows.json"),
        ("/api/records", "record_page.json"),
        ("/api/timeline/4417", "timeline.json"),
        ("/api/settings", "settings.json"),
    ]:
        r = client.get(path)
        assert r.status_code == 200, path
        assert r.json() == canned(name), path


def test_upload():
    r = client.post("/api/files", files={"file": ("shift1_log.csv", b"x")})
    assert r.json() == canned("file_result.json")
    r = client.post("/api/files", files={"file": ("shift2_export.csv", b"y")})
    assert r.json() == canned("file_result_recognized.json")


def test_posts():
    body = {"answers": [{"question_id": "q1", "value": "lot"}]}
    assert client.post("/api/files/f1/answers", json=body).json() == canned("save_result.json")
    assert client.post("/api/find", json={"text": "4417"}).json() == canned("answer.json")
    assert client.post("/api/find", json={"text": "9999"}).json() == canned("answer_no_match.json")
    assert client.post("/api/draft", json={"lot": "4417", "reading": None}).json() == canned("granite_job4.json")
    assert client.post("/api/records/ask", json={"question": "q"}).json() == canned("records_question.json")
    assert client.put("/api/settings", json=canned("settings.json")).json() == canned("settings.json")


def test_csv():
    r = client.get("/api/records.csv")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    assert r.text.splitlines()[0]
