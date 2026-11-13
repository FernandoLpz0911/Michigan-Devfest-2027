"""Write a cleaned copy of a file as CSV or Excel (Card L7)."""
import csv
import io
from datetime import datetime

from openpyxl import Workbook
from openpyxl.styles import Font

from backend.fileview import file_view

SHOWN = {"lot": "Lot number", "part": "Part number", "quantity": "Quantity", "time": "Time",
         "machine": "Machine", "operator": "Operator", "shift": "Shift", "step": "Step",
         "alarm": "Machine stop"}
TYPES = {"csv": "text/csv", "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}


def _time(text, dates):
    try:
        when = datetime.strptime(text, "%Y-%m-%dT%H:%M")
    except ValueError:
        return text
    if dates == "us":
        return when.strftime("%m/%d/%Y ") + str(int(when.strftime("%I"))) + when.strftime(":%M %p")
    return when.strftime("%Y-%m-%d %H:%M")


def cleaned_file(table, fmt, matched, entries, held, file_id, options):
    """Return (bytes, file name, content type). options: format, dates, held, and the view filters."""
    kind = options.get("kind")
    if not options.get("held"):
        kind = kind or "entry"
    filters = {k: options.get(k) for k in ("q", "column", "value")}
    filters["kind"] = kind
    view = file_view(table, fmt, matched, entries, held, file_id, filters, limit=None)
    cols = view["columns"]
    head = [SHOWN.get(c["field"]) or c["header"] for c in cols]
    with_held = bool(options.get("held"))
    out = [head + (["Held back because"] if with_held else [])]
    for r in view["rows"]:
        if r["kind"] == "entry":
            row = [_time(v, options.get("dates")) if c["field"] == "time" else v
                   for c, v in zip(cols, r["clean"])]
            out.append(row + ([""] if with_held else []))
        elif r["kind"] == "held" and with_held:
            out.append(list(r["raw"]) + [r["reason_text"]])
    fmt_name = "xlsx" if options.get("format") == "xlsx" else "csv"
    name = table["source_file"].rsplit(".", 1)[0] + "_cleaned." + fmt_name
    if fmt_name == "csv":
        buf = io.StringIO()
        csv.writer(buf).writerows(out)
        return buf.getvalue().encode("utf-8"), name, TYPES["csv"]
    wb = Workbook()
    ws = wb.active
    for row in out:
        ws.append(row)
    for cell in ws[1]:
        cell.font = Font(bold=True)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue(), name, TYPES["xlsx"]
