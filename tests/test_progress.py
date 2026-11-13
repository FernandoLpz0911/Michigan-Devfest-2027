import pytest

from backend.progress import get_step, set_step


def test_unknown_file_has_no_step():
    assert get_step("f-none") is None


def test_set_then_get_returns_step():
    set_step("f1", "header")
    set_step("f1", "granite")
    assert get_step("f1") == "granite"


def test_steps_are_per_file():
    set_step("f2", "cleaning")
    set_step("f3", "records")
    assert get_step("f2") == "cleaning"
    assert get_step("f3") == "records"


def test_unknown_step_is_rejected():
    with pytest.raises(ValueError):
        set_step("f4", "reading")
