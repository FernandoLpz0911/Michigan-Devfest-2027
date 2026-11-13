from pathlib import Path

from backend import reader, types

FIX = Path(__file__).resolve().parents[1] / "fixtures"


def _profiles(name):
    t = reader.read_table(str(FIX / name), name)
    return {p["header"]: p for p in types.profile_columns(t["headers"], t["rows"])}


def test_shift1_types():
    p = _profiles("shift1_log.csv")
    assert p["Prod Dt"]["detected_type"] == "date"
    assert p["Logged"]["detected_type"] == "date"
    assert p["Qty"]["detected_type"] == "number"
    assert p["Ref"]["detected_type"] == "number"
    assert p["Part"]["detected_type"] == "text"
    assert "B-118" in p["Part"]["distinct"]
    assert p["Part"]["distinct"] is not None and p["Qty"]["distinct"] is None


def test_shift2_date_with_unreadable_value_is_date():
    p = _profiles("shift2_export.csv")
    assert p["PROD DT"]["detected_type"] == "date"


def test_shift3_date_style_is_date():
    p = _profiles("shift3.xlsx")
    assert p["Prod_Dt"]["detected_type"] == "date"


def test_three_date_styles_detected():
    for style in ["5/3/21 6:01a", "2021-05-03 14:03", "04-May-2021 22:10"]:
        p = types.profile_columns(["T"], [[style], [style], [style]])[0]
        assert p["detected_type"] == "date", style


def test_machine_export_times_are_date():
    vals = ["2020-01-01 11:21:28.907000+00:00", "2020-01-02 09:00:01.000000+00:00", "2021-05-04T14:02:28Z"]
    p = types.profile_columns(["T"], [[v] for v in vals])[0]
    assert p["detected_type"] == "date"


def test_unix_numbers_stay_number():
    p = types.profile_columns(["U"], [["1577877688.907"], ["1577877700.112"]])[0]
    assert p["detected_type"] == "number"


def test_empty_column_is_text_with_no_samples():
    rows = [["x", ""], ["y", ""]]
    p = types.profile_columns(["A", "B"], rows)[1]
    assert p["detected_type"] == "text"
    assert p["samples"] == []
    assert p["distinct"] == []


def test_repeated_value_column():
    p = types.profile_columns(["Lot"], [["4384"]] * 3)[0]
    assert p["detected_type"] == "number"
    assert p["samples"] == ["4384"]


def test_samples_and_distinct_limits():
    rows = [[f"v{i}"] for i in range(300)]
    p = types.profile_columns(["Name"], rows)[0]
    assert len(p["samples"]) == 5
    assert len(p["distinct"]) == 200
