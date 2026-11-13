from pathlib import Path

from backend import reader

FIX = Path(__file__).resolve().parents[1] / "fixtures"


def _read(name):
    return reader.read_table(str(FIX / name), name)


def test_shift1_header_row_and_skipped_rows():
    t = _read("shift1_log.csv")
    assert t["header_row"] == 4
    assert t["headers"][:3] == ["Ref", "Part", "Qty"]
    assert [s["source_row"] for s in t["skipped"]] == [1, 2, 3]
    assert [s["reason"] for s in t["skipped"]] == ["title", "title", "blank"]
    assert t["source_rows"][0] == 5
    assert len(t["rows"]) == len(t["source_rows"])


def test_shift2_header_row_and_skipped_rows():
    t = _read("shift2_export.csv")
    assert t["header_row"] == 3
    assert t["headers"][0] == "REF"
    assert [s["source_row"] for s in t["skipped"]] == [1, 2]
    assert t["source_rows"][0] == 4


def test_shift3_header_row_and_skipped_rows():
    t = _read("shift3.xlsx")
    assert t["header_row"] == 3
    assert t["headers"][0] == "Ref#"
    assert [s["source_row"] for s in t["skipped"]] == [1, 2]
    assert t["source_rows"][0] == 4


def test_no_blank_rows_in_rows():
    for name in ("shift1_log.csv", "shift2_export.csv", "shift3.xlsx"):
        t = _read(name)
        assert all(any(c.strip() for c in r) for r in t["rows"])


def test_empty_and_repeated_columns_do_not_crash(tmp_path):
    p = tmp_path / "x.csv"
    p.write_text("Ref,Gap,Same\n1,,x\n2,,x\n")
    t = reader.read_table(str(p), "x.csv")
    assert t["header_row"] == 1
    assert t["headers"] == ["Ref", "Gap", "Same"]
    assert t["rows"] == [["1", "", "x"], ["2", "", "x"]]
