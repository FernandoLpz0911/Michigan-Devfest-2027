import json
import pathlib

from backend.review import build_questions

CANNED = pathlib.Path(__file__).parent.parent / "fixtures" / "canned"
HEADERS = ["Ref", "Part", "Qty", "Prod Dt", "Logged", "Mach", "Op", "Shift", "Step", "Alarm", "Notes"]
TYPES = ["number", "text", "number", "date", "date", "text", "text", "text", "text", "text", "text"]


def profiles(headers=HEADERS, types=TYPES):
    return [{"position": i, "header": h, "detected_type": t, "samples": ["s%d" % i],
             "distinct": None if t != "text" else ["a", "b"]} for i, (h, t) in enumerate(zip(headers, types))]


def lab(position, field, sure=True, alternatives=()):
    return {"position": position, "field": field, "alternatives": list(alternatives), "reason": "", "sure": sure}


def kinds(r):
    return [q["kind"] for q in r["questions"]]


def test_fixture1_exactly_three_questions():
    labels = json.loads((CANNED / "granite_job1.json").read_text())
    merges = json.loads((CANNED / "granite_job2.json").read_text())
    r = build_questions(profiles(), labels, merges, False)
    assert kinds(r) == ["duplicate", "unsure", "merge"]
    assert [q["question_id"] for q in r["questions"]] == ["q1", "q2", "q3"]
    assert r["questions"][1]["preselected"] == "lot"
    assert [m["position"] for m in r["matched"]] == [1, 2, 6, 7, 8, 9, 10]
    assert all(m["decided_by"] == "granite" for m in r["matched"])
    for q in r["questions"]:
        assert len(q["choices"]) <= 4


def test_unsure():
    r = build_questions(profiles(["A", "T"], ["number", "date"]),
                        [lab(0, "lot", False, ["part", "quantity", "shift"]), lab(1, "time")], [], False)
    assert kinds(r) == ["unsure"]
    q = r["questions"][0]
    assert q["kind"] == "unsure" and q["preselected"] == "lot"
    assert [c["value"] for c in q["choices"]] == ["lot", "part", "quantity", "extra"]
    assert q["choices"][0]["granite_guess"] and q["choices"][-1]["text"] == "Something else"


def test_unsure_extra_with_no_alternatives_still_offers_real_choices():
    r = build_questions(profiles(["L", "T", "pi"], ["text", "date", "number"]),
                        [lab(0, "lot"), lab(1, "time"), lab(2, "extra", False)], [], False)
    q = r["questions"][0]
    assert [c["value"] for c in q["choices"]] == ["lot", "quantity", "extra"]
    assert q["preselected"] == "extra" and q["choices"][-1]["granite_guess"]


def test_type_conflict_time_and_quantity():
    r = build_questions(profiles(["L", "T", "Q"], ["text", "number", "text"]),
                        [lab(0, "lot"), lab(1, "time", True, ["extra"]), lab(2, "quantity")], [], False)
    assert kinds(r) == ["type_conflict", "type_conflict"]
    tc = r["questions"]
    assert tc[0]["preselected"] is None and tc[1]["preselected"] is None
    assert tc[0]["sentence"] == "Granite says this is the time, but its values are numbers, not dates."
    assert r["matched"] == [{"position": 0, "header": "L", "field": "lot", "decided_by": "granite"}]


def test_lot_text_is_not_conflict():
    r = build_questions(profiles(["L", "T"], ["text", "date"]), [lab(0, "lot"), lab(1, "time")], [], False)
    assert r["questions"] == [] and len(r["matched"]) == 2


def test_duplicate():
    r = build_questions(profiles(["L", "T1", "T2"], ["number", "date", "date"]),
                        [lab(0, "lot"), lab(1, "time"), lab(2, "time")], [], False)
    q = r["questions"][0]
    assert kinds(r) == ["duplicate"] and q["title"] == "Which one is the time?"
    assert [c["value"] for c in q["choices"]] == ["1", "2", "none"] and q["choices"][0]["samples"] == ["s1"]
    assert q["choices"][-1]["text"] == "None of these"
    assert q["preselected"] is None and [m["position"] for m in r["matched"]] == [0]


def test_duplicate_of_four_stays_within_four_choices():
    r = build_questions(profiles(["L", "A", "B", "C", "D"], ["number"] + ["text"] * 4),
                        [lab(0, "lot")] + [lab(i, "part") for i in range(1, 5)], [], False)
    assert len(r["questions"][0]["choices"]) <= 4


def test_two_extra_columns_are_fine():
    r = build_questions(profiles(["L", "T", "N1", "N2"], ["number", "date", "text", "text"]),
                        [lab(0, "lot"), lab(1, "time"), lab(2, "extra"), lab(3, "extra")], [], False)
    assert r["questions"] == [] and len(r["matched"]) == 4


def test_missing_lot_and_time():
    r = build_questions(profiles(["A", "B", "C"], ["text", "date", "number"]),
                        [lab(0, "part"), lab(1, "extra"), lab(2, "quantity")], [], False)
    assert kinds(r) == ["missing", "missing"]
    lot_q, time_q = r["questions"]
    assert lot_q["title"] == "Which column is the lot number?" and lot_q["sentence"].startswith("None was found.")
    assert time_q["title"] == "Which column is the time?"
    assert time_q["choices"][0]["value"] == "1"
    assert lot_q["choices"][-1] == {"value": "none", "text": "None of these", "samples": [], "granite_guess": False}
    assert all(len(q["choices"]) <= 4 and q["preselected"] is None for q in r["questions"])


def test_merge():
    r = build_questions(profiles(["L", "T", "M"], ["number", "date", "text"]),
                        [lab(0, "lot"), lab(1, "time"), lab(2, "machine")],
                        [{"position": 2, "values": ["Press 3", "P3"], "name": "Press 3"}], False)
    q = r["questions"][0]
    assert kinds(r) == ["merge"] and q["preselected"] == "yes" and q["positions"] == [2]
    assert q["choices"][0] == {"value": "yes", "text": 'Yes, all are "Press 3"',
                               "samples": ["Press 3", "P3"], "granite_guess": True}
    assert q["choices"][1]["value"] == "no"


def test_order_of_questions():
    labels = [lab(0, "part", False), lab(1, "time"), lab(2, "time"), lab(3, "quantity"), lab(4, "machine")]
    r = build_questions(profiles(list("ABCDE"), ["text", "date", "date", "text", "text"]), labels,
                        [{"position": 4, "values": ["a", "b"], "name": "a"}], False)
    assert kinds(r) == ["missing", "duplicate", "type_conflict", "unsure", "merge"]


def test_fallback():
    r = build_questions(profiles(), [], [{"position": 5, "values": ["a", "b"], "name": "a"}], True)
    assert len(r["questions"]) == 11 and r["matched"] == []
    for q in r["questions"]:
        assert q["preselected"] is None and len(q["choices"]) <= 4
        assert not any(c["granite_guess"] for c in q["choices"])
        assert q["kind"] == "unsure"
