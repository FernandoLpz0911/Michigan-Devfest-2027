"""Skeleton routes: every route returns canned JSON. No logic."""
import csv
import io
import json
import os
from pathlib import Path

from fastapi import FastAPI, File, Request, UploadFile
from fastapi.responses import Response

CANNED = Path(__file__).resolve().parent.parent / "fixtures" / "canned"
app = FastAPI()


def canned(name):
    return json.loads((CANNED / name).read_text())


@app.post("/api/files")
async def upload(file: UploadFile = File(...)):
    recognized = "shift2" in (file.filename or "")
    return canned("file_result_recognized.json" if recognized else "file_result.json")


@app.get("/api/files")
def list_files():
    return canned("file_rows.json")


@app.get("/api/files/{file_id}/status")
def status(file_id: str):
    return canned("file_status.json")


@app.post("/api/files/{file_id}/answers")
async def answers(file_id: str, request: Request):
    return canned("save_result.json")


@app.get("/api/files/{file_id}/detail")
def detail(file_id: str):
    return canned("file_detail.json")


@app.get("/api/files/{file_id}/granite")
def granite(file_id: str):
    return canned("granite_exchanges.json")


@app.get("/api/files/{file_id}/view")
def view(file_id: str):
    return canned("file_view.json")


@app.post("/api/find")
async def find(request: Request):
    text = ((await request.json()).get("text") or "").strip()
    lone_unknown = " " not in text and text != "4417"
    return canned("answer_no_match.json" if lone_unknown else "answer.json")


@app.post("/api/draft")
async def draft(request: Request):
    return canned("granite_job4.json")


@app.get("/api/held")
def held():
    return canned("held_rows.json")


@app.get("/api/records")
def records():
    return canned("record_page.json")


@app.get("/api/records.csv")
def records_csv():
    rows = canned("record_page.json")["rows"]
    out = io.StringIO()
    if rows:
        w = csv.writer(out)
        keys = [k for k, v in rows[0].items() if not isinstance(v, (dict, list))]
        w.writerow(keys)
        for r in rows:
            w.writerow([r.get(k) for k in keys])
    return Response(out.getvalue(), media_type="text/csv")


@app.get("/api/timeline/{lot}")
def timeline(lot: str):
    return canned("timeline.json")


@app.post("/api/records/ask")
async def records_ask(request: Request):
    return canned("records_question.json")


@app.get("/api/settings")
def get_settings():
    return canned("settings.json")


@app.put("/api/settings")
async def put_settings(request: Request):
    return canned("settings.json")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT", "8000")))
