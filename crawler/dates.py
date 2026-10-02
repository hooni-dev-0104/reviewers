"""KST recruitment dates. Only December/January may cross an inferred year."""
from datetime import date, datetime, timezone, timedelta
import re

KST = timezone(timedelta(hours=9))


def kst_today() -> date:
    return datetime.now(KST).date()


def parse_day(value: str | None, today: date | None = None) -> str | None:
    today = today or kst_today()
    match = re.fullmatch(r"(?:(\d{4})[./-])?(\d{1,2})[./-](\d{1,2})", (value or "").strip())
    if not match:
        return None
    year, month, day = match.groups()
    month, day = int(month), int(day)
    inferred_year = today.year + (1 if today.month == 12 and month == 1 else -1 if today.month == 1 and month == 12 else 0)
    try:
        return date(int(year) if year else inferred_year, month, day).isoformat()
    except ValueError:
        return None


def parse_range(value: str | None, today: date | None = None) -> tuple[str | None, str | None]:
    today = today or kst_today()
    token = r"(?:(?:\d{4})[./-])?\d{1,2}[./-]\d{1,2}"
    match = re.fullmatch(rf"\s*({token})\s*[~–-]\s*({token})\s*", value or "")
    if not match:
        return None, None
    raw_start, raw_end = match.groups()
    start, end = parse_day(raw_start, today), parse_day(raw_end, today)
    if not start or not end:
        return None, None
    explicit_start = bool(re.match(r"^\d{4}[./-]", raw_start))
    explicit_end = bool(re.match(r"^\d{4}[./-]", raw_end))
    s, e = date.fromisoformat(start), date.fromisoformat(end)
    if s.month == 12 and e.month == 1:
        # Only an adjacent year is justified; explicit years always win.
        if explicit_start and not explicit_end:
            e = e.replace(year=s.year + 1)
        elif explicit_end and not explicit_start:
            s = s.replace(year=e.year - 1)
        elif not explicit_start and not explicit_end:
            if today.month not in (1, 12):
                return None, None
            e = e.replace(year=s.year + 1)
    if s > e:
        return None, None
    return s.isoformat(), e.isoformat()


def deadline_for_storage(value: str | None) -> str | None:
    """Date-only deadline is inclusive through KST day end; offsets are preserved."""
    if value and re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        try:
            date.fromisoformat(value)
            return value + "T23:59:59.999+09:00"
        except ValueError:
            return None
    return value
