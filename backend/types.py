import re

_DATE_PATTERNS = [
    re.compile(r"\d{1,2}/\d{1,2}/\d{2,4}(\s+\d{1,2}:\d{2}\s*([ap]m?)?)?", re.IGNORECASE),
    re.compile(r"\d{4}-\d{2}-\d{2}([ T]\d{1,2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?"),
    re.compile(r"\d{1,2}-[A-Za-z]{3}-\d{2,4}( \d{1,2}:\d{2})?"),
]
_NUMBER = re.compile(r"[-+]?\d[\d,]*(\.\d+)?")
_MOSTLY = 0.8


def _is_date(value: str) -> bool:
    return any(p.fullmatch(value) for p in _DATE_PATTERNS)


def _is_number(value: str) -> bool:
    return bool(_NUMBER.fullmatch(value))


def _detected_type(values: list[str]) -> str:
    for kind, test in (("date", _is_date), ("number", _is_number)):
        if values and sum(test(v) for v in values) >= _MOSTLY * len(values):
            return kind
    return "text"


def _samples(distinct: list[str]) -> list[str]:
    n = len(distinct)
    if n <= 5:
        return distinct
    return [distinct[round(k * (n - 1) / 4)] for k in range(5)]


def profile_columns(headers: list[str], rows: list[list[str]]) -> list[dict]:
    profiles = []
    for pos, header in enumerate(headers):
        values = [r[pos].strip() for r in rows if pos < len(r) and r[pos].strip()]
        distinct = list(dict.fromkeys(values))
        kind = _detected_type(values)
        profiles.append({
            "position": pos,
            "header": header,
            "detected_type": kind,
            "samples": _samples(distinct),
            "distinct": distinct[:200] if kind == "text" else None,
        })
    return profiles
