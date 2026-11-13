from backend.risk import find_links


def E(lot, time, machine="Press 3", operator=None, shift=None, alarm=None, part="B-220"):
    return {"entry_id": f"t-{lot}-{time}", "lot": lot, "part": part, "time": time,
            "machine": machine, "operator": operator, "shift": shift, "alarm": alarm}


def test_same_machine_window_links():
    r = find_links("1", [E("1", "2021-05-04T10:00"), E("2", "2021-05-04T10:35")])
    assert [l["lot"] for l in r["links"]] == ["2"]
    assert r["links"][0]["rules"] == ["same_machine_window"]
    assert r["links"][0]["reasons"] == ["Same machine, 35 minutes later"]
    assert r["links"][0]["closeness_minutes"] == 35


def test_same_machine_window_does_not_link_outside_window_or_machine():
    r = find_links("1", [E("1", "2021-05-04T10:00"), E("2", "2021-05-04T15:00"),
                         E("3", "2021-05-04T10:30", machine="Press 9")])
    assert r["links"] == []


def test_same_machine_window_earlier_reason():
    r = find_links("1", [E("1", "2021-05-04T10:00"), E("2", "2021-05-04T08:00")])
    assert r["links"][0]["reasons"] == ["Same machine, 2 hours earlier"]


def test_same_stop_links_and_does_not_link_other_codes_or_days():
    r = find_links("1", [E("1", "2021-05-04T10:00", alarm="A_101"),
                         E("2", "2021-05-04T15:00", alarm="A_101"),
                         E("3", "2021-05-05T10:00", alarm="A_101"),
                         E("4", "2021-05-04T15:00", alarm="A_202"),
                         E("5", "2021-05-04T15:00")])
    assert [l["lot"] for l in r["links"]] == ["2"]
    assert r["links"][0]["rules"] == ["same_stop"]
    assert r["links"][0]["reasons"] == ["Same machine stop, code A_101"]
    assert r["links"][0]["closeness_minutes"] == 300


def test_same_operator_shift_links_and_does_not_link_other_shift_or_day():
    r = find_links("1", [E("1", "2021-05-04T08:00", machine="Press 1", operator="OP-1", shift="1st"),
                         E("2", "2021-05-04T15:00", machine="Press 2", operator="OP-1", shift="1st"),
                         E("3", "2021-05-04T15:00", machine="Press 2", operator="OP-1", shift="2nd"),
                         E("4", "2021-05-05T09:00", machine="Press 2", operator="OP-1", shift="1st")])
    assert [l["lot"] for l in r["links"]] == ["2"]
    assert r["links"][0]["rules"] == ["same_operator_shift"]
    assert r["links"][0]["reasons"] == ["Same operator and shift, same day"]
    assert r["links"][0]["closeness_minutes"] == 420


def test_lot_linked_by_two_rules_appears_once_with_both_reasons():
    r = find_links("1", [E("1", "2021-05-04T10:00", alarm="A_101", operator="OP-1", shift="1st"),
                         E("2", "2021-05-04T10:30", alarm="A_101", operator="OP-1", shift="1st")])
    assert len(r["links"]) == 1
    link = r["links"][0]
    assert link["rules"] == ["same_machine_window", "same_stop", "same_operator_shift"]
    assert link["reasons"] == ["Same machine, 30 minutes later",
                               "Same machine stop, code A_101",
                               "Same operator and shift, same day"]
    assert link["closeness_minutes"] == 30


def test_link_carries_part_machine_and_time_of_closest_step():
    r = find_links("1", [E("1", "2021-05-04T10:00"), E("2", "2021-05-04T10:35", part="C-9")])
    link = r["links"][0]
    assert (link["part"], link["machine"], link["time"]) == ("C-9", "Press 3", "2021-05-04T10:35")


def test_sorted_by_closeness_then_lot():
    r = find_links("1", [E("1", "2021-05-04T10:00"), E("9", "2021-05-04T13:00"),
                         E("5", "2021-05-04T10:20"), E("2", "2021-05-04T10:20")])
    assert [l["lot"] for l in r["links"]] == ["2", "5", "9"]


def test_never_links_to_itself():
    r = find_links("1", [E("1", "2021-05-04T10:00", alarm="A_101"),
                         E("1", "2021-05-04T10:30", alarm="A_101")])
    assert r["links"] == []


def test_no_links_returns_empty_list_and_week_count():
    r = find_links("1", [E("1", "2021-05-04T10:00")])
    assert r == {"links": [], "lots_in_week": 1}


def test_window_is_a_parameter_with_four_hour_default():
    entries = [E("1", "2021-05-04T10:00"), E("2", "2021-05-04T15:00")]
    assert find_links("1", entries)["links"] == []
    assert [l["lot"] for l in find_links("1", entries, window_hours=6)["links"]] == ["2"]


def test_lots_in_week_is_monday_to_sunday_of_first_entry():
    r = find_links("1", [E("1", "2021-05-03T10:00"), E("2", "2021-05-09T23:00"),
                         E("3", "2021-05-10T00:00"), E("4", "2021-05-02T12:00")])
    assert r["lots_in_week"] == 2
