"""dates.py FIXED — correct per spec"""
from datetime import datetime, timezone

def parse_date(s: str) -> datetime:
    try:
        if s.endswith("Z"):
            # Z → UTC, parse without Z then attach UTC
            dt = datetime.fromisoformat(s[:-1])
            return dt.replace(tzinfo=timezone.utc)
        else:
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt
    except Exception as e:
        raise ValueError(f"invalid date: {s}") from e
