"""In-memory current step per file ID. Used by the file status route."""

STEPS = ("header", "granite", "cleaning", "records", "done")

_current: dict[str, str] = {}


def set_step(file_id: str, step: str) -> None:
    if step not in STEPS:
        raise ValueError(f"Unknown step: {step}")
    _current[file_id] = step


def get_step(file_id: str) -> str | None:
    return _current.get(file_id)
