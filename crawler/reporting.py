from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


PUBLIC_SOURCE_SLUGS = ["4blog", "dinnerqueen", "reviewnote", "revu"]

APPLICANT_CORE_FIELDS = [
    ("title", "title"),
    ("original_url", "original_url"),
    ("platform_type", "platform"),
    ("campaign_type", "type"),
    ("region_primary_name", "region"),
    ("benefit_text", "benefit"),
    ("apply_deadline", "deadline"),
    ("recruit_count", "slots"),
    ("snippet", "mission_or_summary"),
]


def build_source_quality_report(result: dict[str, Any]) -> str:
    generated_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    lines = [
        "# Public Source Quality Report",
        "",
        f"- generated_at: {generated_at}",
        f"- mode: {result.get('mode', 'scheduled-refresh')}",
        f"- dry_run: {result.get('dry_run')}",
        f"- delete_before_refresh: {result.get('delete_before_refresh')}",
        "",
        "## Totals",
        "",
        f"- fetched: {result['totals']['fetched']}",
        f"- normalized: {result['totals']['normalized']}",
        f"- failed: {result['totals']['failed']}",
        f"- deleted: {result['totals']['deleted']}",
        "",
        "## Source Results",
        "",
        "| source | fetched | normalized | failed | deleted | sample title | notes |",
        "| --- | ---: | ---: | ---: | ---: | --- | --- |",
    ]

    for item in result.get("results", []):
        sample_title = ""
        if item.get("payload"):
            sample_title = str(item["payload"][0].get("title", "")).replace("|", "/")
        notes: list[str] = []
        if item.get("errors"):
            notes.append("errors present")
        if item.get("payload") and item["payload"][0].get("requires_review"):
            notes.append("requires_review")
        lines.append(
            f"| {item['source']} | {item['stats'].fetched} | {item['stats'].normalized} | "
            f"{item['stats'].failed} | {item['deleted_count']} | {sample_title} | "
            f"{', '.join(notes) if notes else '-'} |"
        )

    lines.extend(
        [
            "",
            "## Applicant-facing Field Coverage",
            "",
            "| source | total | title | url | platform | type | region | benefit | deadline | slots | mission/summary |",
            "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
        ]
    )

    for item in result.get("results", []):
        payload = item.get("payload", [])
        total = len(payload)
        if total == 0:
            lines.append(f"| {item['source']} | 0 | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |")
            continue
        percentages = []
        for key, _label in APPLICANT_CORE_FIELDS:
            filled = sum(1 for row in payload if row.get(key))
            percentages.append(f"{round((filled / total) * 100)}%")
        lines.append(
            f"| {item['source']} | {total} | " + " | ".join(percentages) + " |"
        )

    lines.extend(
        [
            "",
            "## Applicant-first Interpretation",
            "",
            "- `title`, `url`, `platform`, `type`, `region`, `benefit`, `deadline`, `slots`, and `mission/summary` are the fields most useful to a campaign applicant deciding whether to apply.",
            "- High-volume collection is less valuable than high coverage on those applicant-facing fields.",
            "- Sources with low `deadline` or `region` coverage may still be usable, but usually need `requires_review` or extra parser hardening.",
            "",
            "## Interpretation",
            "",
            "- `fetched` is the number of source rows collected before normalization.",
            "- `normalized` is the number of rows converted into canonical payloads.",
            "- `failed` counts rows rejected by parser/normalization logic.",
            "- `deleted` reflects source-level refresh deletion when enabled.",
            "",
            "## Current Public Parser Set",
            "",
            "- 4blog",
            "- dinnerqueen",
            "- reviewnote",
            "- revu (auth-required)",
        ]
    )

    return "\n".join(lines) + "\n"
