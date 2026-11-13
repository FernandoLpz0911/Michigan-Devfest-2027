import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from backend.formats import load_formats, match_format, save_format  # noqa: E402

# Format saved by hand from fixture 1 (shift1_log.csv, header row 4).
FMT1 = {
    "name": "shift1_log.csv",
    "headers": ["Ref", "Part", "Qty", "Prod Dt", "Logged", "Mach", "Op", "Shift", "Step", "Alarm", "Notes"],
    "mapping": {
        "Ref": "lot", "Part": "part", "Qty": "quantity", "Prod Dt": "time", "Logged": "extra",
        "Mach": "machine", "Op": "operator", "Shift": "shift", "Step": "step", "Alarm": "alarm",
        "Notes": "extra",
    },
    "value_rules": {"machine": {"PRESS-3": "Press 3", "P3": "Press 3"}},
    "created_at": "2026-11-13T11:02",
}

# Headers from fixture 2 (shift2_export.csv, header row 3) and fixture 3 (shift3.xlsx).
FIXTURE1_HEADERS = FMT1["headers"]
FIXTURE2_HEADERS = ["REF", "PART", "QTY", "PROD DT", "MACH", "OP", "SHIFT", "STEP", "ALARM", "NOTES"]
FIXTURE3_HEADERS = ["Ref#", "Part", "Qty", "Prod_Dt", "Mach", "Op", "Shift", "Step", "Alarm", "Comments"]
UNRELATED_HEADERS = ["Customer", "Invoice", "Total", "Due"]


def test_save_and_load_round_trip(tmp_path):
    saved = save_format(FMT1, str(tmp_path))
    assert saved["format_id"] == "fmt1"
    loaded = load_formats(str(tmp_path))
    assert len(loaded) == 1
    assert loaded[0]["mapping"] == FMT1["mapping"]
    assert loaded[0]["value_rules"] == FMT1["value_rules"]


def test_load_formats_empty_folder(tmp_path):
    assert load_formats(str(tmp_path)) == []


def test_fixture2_matches_saved_format(tmp_path):
    formats = [save_format(FMT1, str(tmp_path))]
    result = match_format(FIXTURE2_HEADERS, formats)
    assert result["matched"] is True
    assert result["format_id"] == "fmt1"
    assert result["header_map"]["REF"] == "Ref"
    assert result["header_map"]["PROD DT"] == "Prod Dt"
    assert result["new_columns"] == []
    assert result["missing_columns"] == ["Logged"]


def test_fixture3_matches_saved_format(tmp_path):
    formats = [save_format(FMT1, str(tmp_path))]
    result = match_format(FIXTURE3_HEADERS, formats)
    assert result["matched"] is True
    assert result["format_id"] == "fmt1"
    assert result["header_map"]["Ref#"] == "Ref"
    assert result["header_map"]["Prod_Dt"] == "Prod Dt"
    assert result["new_columns"] == ["Comments"]
    assert result["missing_columns"] == ["Logged", "Notes"]


def test_one_extra_column_matches_and_is_new(tmp_path):
    formats = [save_format(FMT1, str(tmp_path))]
    result = match_format(FIXTURE1_HEADERS + ["Operator Note"], formats)
    assert result["matched"] is True
    assert result["new_columns"] == ["Operator Note"]
    assert result["missing_columns"] == []


def test_missing_mapped_column_does_not_match(tmp_path):
    formats = [save_format(FMT1, str(tmp_path))]
    headers = [h for h in FIXTURE1_HEADERS if h != "Mach"]
    result = match_format(headers, formats)
    assert result == {"matched": False, "format_id": None, "header_map": {},
                      "new_columns": [], "missing_columns": []}


def test_unrelated_file_does_not_match(tmp_path):
    formats = [save_format(FMT1, str(tmp_path))]
    result = match_format(UNRELATED_HEADERS, formats)
    assert result == {"matched": False, "format_id": None, "header_map": {},
                      "new_columns": [], "missing_columns": []}


def test_no_saved_formats_does_not_match():
    result = match_format(FIXTURE1_HEADERS, [])
    assert result["matched"] is False
    assert result["format_id"] is None
