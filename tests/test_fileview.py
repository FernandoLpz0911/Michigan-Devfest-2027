from backend.fileview import file_view

TABLE = {"source_file": "a.csv", "header_row": 3,
         "skipped": [{"source_row": 1, "reason": "title", "text": "DEMO LOG"},
                     {"source_row": 2, "reason": "blank", "text": ""}],
         "headers": ["Ref", "Prod Dt", "Mach", "Notes"],
         "rows": [["4384", "5/3/21 6:01a", "P3", "hi"], ["", "5/3/21 7:00a", "P3", ""]],
         "source_rows": [4, 5]}
FMT = {"mapping": {"Ref": "lot", "Prod Dt": "time", "Mach": "machine", "Notes": "extra"}}
MATCHED = [{"position": 0, "header": "Ref", "field": "lot", "decided_by": "granite"}]
ENTRIES = [{"entry_id": "f1-r4", "lot": "4384", "time": "2021-05-03T06:01", "machine": "Press 3",
            "extra": {"Notes": "hi"}, "source_row": 4, "changed": ["time", "machine"]}]
HELD = [{"source_row": 5, "reason_text": "No lot number", "original_row": {}}]


def view(n_rows=None, table=TABLE):
    return file_view(table, FMT, MATCHED, ENTRIES, HELD, "f1")


def test_rows_and_kinds():
    v = view()
    assert v["file_id"] == "f1" and v["source_file"] == "a.csv" and v["total_rows"] == 5
    assert [r["kind"] for r in v["rows"]] == ["skipped", "skipped", "header", "entry", "held"]
    assert [r["reason_text"] for r in v["rows"]] == ["title row", "blank row", None, None, "No lot number"]
    assert v["rows"][0]["raw"] == ["DEMO LOG", "", "", ""] and v["rows"][0]["clean"] is None


def test_clean_values():
    r = view()["rows"]
    assert r[3]["clean"] == ["4384", "2021-05-03T06:01", "Press 3", "hi"]
    assert r[3]["raw"][2] == "P3" and r[4]["clean"] is None


def test_columns():
    c = view()["columns"]
    assert c[0] == {"position": 0, "header": "Ref", "field": "lot", "decided_by": "granite", "rows_changed": 0}
    assert c[1]["decided_by"] == "person" and c[1]["rows_changed"] == 1 and c[2]["rows_changed"] == 1
    assert c[3]["field"] == "extra"


def test_only_50_lines():
    t = dict(TABLE, rows=[["1", "x", "y", "z"]] * 80, source_rows=list(range(4, 84)))
    v = file_view(t, FMT, MATCHED, [], [{"source_row": n, "reason_text": "Empty"} for n in range(4, 84)], "f1")
    assert len(v["rows"]) == 50 and v["total_rows"] == 83


def filtered(**f):
    return file_view(TABLE, FMT, MATCHED, ENTRIES, HELD, "f1", f)


def test_no_filters_has_no_matching():
    assert "matching" not in view() and "matching" not in filtered(q="")


def test_q_matches_raw_or_clean_ignoring_case():
    v = filtered(q="press 3")
    assert v["matching"] == 1 and [r["kind"] for r in v["rows"]] == ["header", "entry"]
    assert filtered(q="P3")["matching"] == 2 and filtered(q="zzz")["matching"] == 0


def test_column_and_value():
    assert filtered(column=2, value="PRESS 3")["matching"] == 1
    assert filtered(column=2, value="p3")["matching"] == 2
    assert filtered(column=2, value="Press")["matching"] == 0


def test_kind_and_skipped_left_out():
    v = filtered(kind="held")
    assert v["matching"] == 1 and v["rows"][1]["kind"] == "held" and v["total_rows"] == 5
    assert all(r["kind"] != "skipped" for r in filtered(q="DEMO")["rows"]) and filtered(q="DEMO")["matching"] == 0


def test_matching_counts_whole_file():
    t = dict(TABLE, rows=[["1", "x", "y", "z"]] * 80, source_rows=list(range(4, 84)))
    held = [{"source_row": n, "reason_text": "Empty"} for n in range(4, 84)]
    v = file_view(t, FMT, MATCHED, [], held, "f1", {"q": "x"})
    assert v["matching"] == 80 and len(v["rows"]) == 51
