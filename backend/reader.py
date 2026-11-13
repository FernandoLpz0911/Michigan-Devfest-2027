import csv
import math
from datetime import datetime
from pathlib import Path

import pandas as pd


def _cell_text(value) -> str:
    if pd.isna(value):
        return ""
    if isinstance(value, datetime):
        if value.hour == 0 and value.minute == 0:
            return value.strftime("%Y-%m-%d")
        return value.strftime("%Y-%m-%d %H:%M")
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def _grid(path: str) -> list[list[str]]:
    if Path(path).suffix.lower() in (".xlsx", ".xls"):
        frame = pd.read_excel(path, header=None, sheet_name=0, dtype=object)
        return [[_cell_text(v) for v in row] for row in frame.values.tolist()]
    with open(path, newline="", encoding="utf-8-sig") as f:
        return [row for row in csv.reader(f)]


def _filled(cells: list[str]) -> int:
    return sum(1 for c in cells if c.strip() != "")


def _find_header(grid: list[list[str]]) -> int:
    width = max((_filled(r) for r in grid), default=0)
    need = max(1, math.ceil(width / 2))
    for i, row in enumerate(grid):
        if _filled(row) >= need:
            return i
    return len(grid)


def _skip(source_row: int, cells: list[str]) -> dict:
    if _filled(cells) == 0:
        return {"source_row": source_row, "reason": "blank", "text": ""}
    text = " ".join(c.strip() for c in cells if c.strip())
    return {"source_row": source_row, "reason": "title", "text": text}


def read_table(path: str, source_file: str) -> dict:
    grid = _grid(path)
    h = _find_header(grid)
    headers = list(grid[h]) if h < len(grid) else []
    while headers and headers[-1].strip() == "":
        headers.pop()
    width = len(headers)

    skipped = [_skip(i + 1, grid[i]) for i in range(h)]
    rows, source_rows = [], []
    for i in range(h + 1, len(grid)):
        cells = grid[i]
        if _filled(cells) == 0:
            skipped.append({"source_row": i + 1, "reason": "blank", "text": ""})
        else:
            rows.append((cells + [""] * width)[:width])
            source_rows.append(i + 1)

    return {
        "source_file": source_file,
        "header_row": h + 1 if headers else 0,
        "skipped": skipped,
        "headers": headers,
        "rows": rows,
        "source_rows": source_rows,
    }
