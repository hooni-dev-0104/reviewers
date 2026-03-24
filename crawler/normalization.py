from __future__ import annotations

from typing import Any

from crawler.models import CampaignRecord


PLATFORM_MAP = {
    "blog": "blog",
    "instagram": "instagram",
    "insta": "instagram",
    "youtube": "youtube",
    "tiktok": "tiktok",
    "mixed": "mixed",
}

CAMPAIGN_TYPE_MAP = {
    "visit": "visit",
    "방문": "visit",
    "delivery": "delivery",
    "배송": "delivery",
    "purchase": "purchase",
    "구매": "purchase",
    "content": "content",
    "mixed": "mixed",
}

STATUS_MAP = {
    "active": "active",
    "open": "active",
    "expired": "expired",
    "closed": "expired",
    "removed": "removed",
    "hidden": "hidden",
    "draft": "draft",
}


def normalize_platform_type(value: str | None) -> str:
    if not value:
        return "blog"
    return PLATFORM_MAP.get(value.strip().lower(), "etc")


def normalize_campaign_type(value: str | None) -> str:
    if not value:
        return "visit"
    return CAMPAIGN_TYPE_MAP.get(value.strip().lower(), "etc")


def normalize_status(value: str | None) -> str:
    if not value:
        return "active"
    return STATUS_MAP.get(value.strip().lower(), "active")


def normalize_snippet(value: str | None, limit: int = 220) -> str | None:
    if not value:
        return None
    compact = " ".join(value.split())
    if len(compact) <= limit:
        return compact
    return compact[: limit - 1].rstrip() + "…"


def normalize_campaign(source_slug: str, source_id: str | None, raw: dict[str, Any]) -> CampaignRecord:
    title = (raw.get("title") or "").strip()
    original_url = (raw.get("original_url") or raw.get("url") or "").strip()
    if not title or not original_url:
        raise ValueError("raw campaign requires title and original_url")

    return CampaignRecord(
        source_slug=source_slug,
        source_id=source_id,
        title=title,
        original_url=original_url,
        platform_type=normalize_platform_type(raw.get("platform_type")),
        campaign_type=normalize_campaign_type(raw.get("campaign_type")),
        category_name=raw.get("category_name"),
        subcategory_name=raw.get("subcategory_name"),
        region_primary_name=raw.get("region_primary_name"),
        region_secondary_name=raw.get("region_secondary_name"),
        exact_location=raw.get("exact_location"),
        latitude=raw.get("latitude"),
        longitude=raw.get("longitude"),
        benefit_text=raw.get("benefit_text"),
        recruit_count=raw.get("recruit_count"),
        apply_deadline=raw.get("apply_deadline"),
        published_at=raw.get("published_at"),
        thumbnail_url=raw.get("thumbnail_url"),
        snippet=normalize_snippet(raw.get("snippet") or raw.get("summary")),
        raw_status=raw.get("raw_status"),
        status=normalize_status(raw.get("status") or raw.get("raw_status")),
        requires_review=bool(raw.get("requires_review", False)),
        raw_payload=dict(raw),
    )
