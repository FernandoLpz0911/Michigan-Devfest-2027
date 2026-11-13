"""Routes. Each route calls the pipeline, which returns the contract shapes.

Ask your records still returns a canned shape (card G3 is cut).
"""
import json
import os
import mimetypes
from pathlib import Path

from fastapi import FastAPI, File, Request, UploadFile
from fastapi.responses import JSONResponse, Response

from backend import export, fileview, pipeline, records
from backend.pipeline import UserError
from backend.timeline import lot_timeline

ROOT = Path(__file__).resolve().parent.parent
CANNED = ROOT / "fixtures" / "canned"


def _load_env():
    """Read .env (git-ignored) into the environment, without overriding real env vars."""
    path = ROOT / ".env"
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_env()
app = FastAPI()


def canned(name):
    return json.loads((CANNED / name).read_text())


@app.exception_handler(UserError)
async def user_error(request, exc: UserError):
    return JSONResponse(status_code=exc.status, content={"error": {"message": exc.message, "fix": exc.fix}})


@app.exception_handler(Exception)
async def any_error(request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": {
        "message": "Something went wrong on our side.", "fix": "Try again. If it keeps happening, restart the app."}})


@app.post("/api/files")
async def upload(file: UploadFile = File(...)):
    rec = pipeline.save_upload(file.filename, await file.read())
    return pipeline.process(rec)


@app.get("/api/files")
def list_files():
    return pipeline.file_rows()


@app.delete("/api/files/{file_id}")
def delete_file(file_id: str):
    return pipeline.delete_file(file_id)


@app.get("/api/files/{file_id}/status")
def status(file_id: str):
    return pipeline.file_status(file_id)


@app.post("/api/files/{file_id}/answers")
async def answers(file_id: str, request: Request):
    body = await request.json()
    return pipeline.apply_answers(file_id, body.get("answers") or [])


@app.get("/api/files/{file_id}/detail")
def detail(file_id: str):
    return pipeline.file_detail(file_id)


@app.get("/api/files/{file_id}/granite")
def granite(file_id: str):
    return pipeline.file_exchanges(file_id)


@app.get("/api/files/{file_id}/view")
def view(file_id: str, q: str = None, column: int = None, value: str = None, kind: str = None):
    table, fmt, matched, entries, held = pipeline.file_parts(file_id)
    filters = {"q": q, "column": column, "value": value, "kind": kind}
    return fileview.file_view(table, fmt, matched, entries, held, file_id, filters)


@app.get("/api/files/{file_id}/download")
def download(file_id: str, version: str = "cleaned", format: str = "csv", dates: str = "iso",
             held: bool = False, q: str = None, column: int = None, value: str = None, kind: str = None):
    rec = pipeline._load(file_id)
    if version == "original":
        path = Path(rec["path"])
        data, name = path.read_bytes(), rec["source_file"]
        kind_ = mimetypes.guess_type(name)[0] or "application/octet-stream"
    else:
        table, fmt, matched, entries, held_rows = pipeline.file_parts(file_id)
        options = {"format": format, "dates": dates, "held": held, "q": q, "column": column,
                   "value": value, "kind": kind}
        data, name, kind_ = export.cleaned_file(table, fmt, matched, entries, held_rows, file_id, options)
    return Response(data, media_type=kind_,
                    headers={"Content-Disposition": f'attachment; filename="{name}"'})


@app.post("/api/find")
async def find(request: Request):
    return pipeline.find((await request.json()).get("text"))


@app.post("/api/draft")
async def draft(request: Request):
    body = await request.json()
    return pipeline.draft(body.get("lot"), body.get("reading"))


@app.get("/api/held")
def held():
    return pipeline.held()


def _filters(request: Request):
    q = request.query_params
    f = {k: (q.get(k) or None) for k in ("q", "machine", "shift", "date_from", "date_to", "stop")}
    f["only_cleaned"] = q.get("only_cleaned") == "true"
    f["only_held"] = q.get("only_held") == "true"
    return f, q.get("page") or 1


@app.get("/api/records")
def records_page(request: Request):
    filters, page = _filters(request)
    return records.query_records(pipeline.con(), filters, page)


@app.get("/api/records.csv")
def records_csv(request: Request):
    filters, _ = _filters(request)
    return Response(records.records_csv(pipeline.con(), filters), media_type="text/csv",
                    headers={"Content-Disposition": 'attachment; filename="records.csv"'})


@app.get("/api/timeline/{lot}")
def timeline(lot: str):
    return lot_timeline(pipeline.con(), lot, pipeline.settings()["window_hours"])


@app.post("/api/records/ask")
async def records_ask(request: Request):
    return canned("records_question.json")


@app.get("/api/settings")
def get_settings():
    return pipeline.settings()


@app.put("/api/settings")
async def put_settings(request: Request):
    return pipeline.save_settings(await request.json())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT", "8000")))
