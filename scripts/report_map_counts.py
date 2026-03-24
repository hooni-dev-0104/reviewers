from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request


SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


def request(method: str, path: str, headers: dict[str, str] | None = None):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1{path}",
        method=method,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            **(headers or {}),
        },
    )
    with urllib.request.urlopen(req, timeout=30) as response:  # noqa: S310
        if method == "HEAD":
            return response.headers
        return json.loads(response.read().decode("utf-8"))


def get_source_id(slug: str) -> str | None:
    query = urllib.parse.urlencode({"slug": f"eq.{slug}", "select": "id", "limit": "1"})
    rows = request("GET", f"/sources?{query}")
    return rows[0]["id"] if rows else None


def count_campaigns(source_id: str, *, exact_only: bool = False, latlng_only: bool = False) -> int:
    query_dict = {
        "select": "id",
        "source_id": f"eq.{source_id}",
        "status": "eq.active",
    }
    if exact_only:
        query_dict["exact_location"] = "not.is.null"
    if latlng_only:
        query_dict["latitude"] = "not.is.null"
        query_dict["longitude"] = "not.is.null"
    query = urllib.parse.urlencode(query_dict)
    headers = request("HEAD", f"/campaigns?{query}", headers={"Prefer": "count=exact"})
    content_range = headers.get("content-range", "*/0")
    return int(content_range.split("/")[-1])


def main():
    targets = ["seouloppa", "gangnammatzip"]
    report = {}
    for slug in targets:
        source_id = get_source_id(slug)
        if not source_id:
            report[slug] = {"error": "source not found"}
            continue
        report[slug] = {
            "active_campaigns": count_campaigns(source_id),
            "exact_location_filled": count_campaigns(source_id, exact_only=True),
            "latlng_filled": count_campaigns(source_id, latlng_only=True),
        }

    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
