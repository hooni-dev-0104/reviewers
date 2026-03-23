from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass(frozen=True)
class SourceDefinition:
    slug: str
    name: str
    base_url: str
    platform_type: str
    crawl_method: str
    source_id: str | None = None


@dataclass
class CampaignRecord:
    source_slug: str
    source_id: str | None
    title: str
    original_url: str
    platform_type: str = "blog"
    campaign_type: str = "visit"
    category_name: str | None = None
    subcategory_name: str | None = None
    region_primary_name: str | None = None
    region_secondary_name: str | None = None
    exact_location: str | None = None
    benefit_text: str | None = None
    recruit_count: int | None = None
    apply_deadline: str | None = None
    published_at: str | None = None
    thumbnail_url: str | None = None
    snippet: str | None = None
    raw_status: str | None = None
    status: str = "active"
    requires_review: bool = False
    crawled_at: str | None = None
    raw_payload: dict[str, Any] = field(default_factory=dict)

    def ensure_crawled_at(self) -> None:
        if not self.crawled_at:
            self.crawled_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    def to_dict(self) -> dict[str, Any]:
        self.ensure_crawled_at()
        return asdict(self)
