from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Any

from crawler.config import AppConfig
from crawler.models import CampaignRecord, SourceDefinition
from crawler.normalization import normalize_campaign
from crawler.sources.seeded import SEEDED_SOURCES, get_adapter
from crawler.supabase_rest import SupabasePostgrestClient


@dataclass
class PipelineStats:
    fetched: int = 0
    normalized: int = 0
    failed: int = 0
    skipped: int = 0


def _iter_batches(items: list[dict[str, Any]], batch_size: int):
    batch_size = max(1, batch_size)
    for start in range(0, len(items), batch_size):
        yield items[start : start + batch_size]


def _source_priority(slug: str) -> int:
    return {
        "reviewnote": 10,
        "revu": 20,
        "dinnerqueen": 30,
        "mrblog": 40,
        "4blog": 50,
        "seouloppa": 60,
        "gangnammatzip": 70,
    }.get(slug, 100)


def _source_notes(slug: str) -> str | None:
    return {
        "seouloppa": "후보 소스 1차 파서 구현",
        "gangnammatzip": "후보 소스 1차 파서 구현",
    }.get(slug)


def _kst_today() -> date:
    return datetime.now(timezone(timedelta(hours=9))).date()


def _is_expired(campaign: CampaignRecord, today: date | None = None) -> bool:
    today = today or _kst_today()
    if campaign.status == "expired":
        return True
    if not campaign.apply_deadline:
        return False
    try:
        return date.fromisoformat(str(campaign.apply_deadline)) < today
    except Exception:
        return False


def build_campaign_payload(campaign: CampaignRecord) -> dict[str, Any]:
    campaign.ensure_crawled_at()
    return {
        "source_id": campaign.source_id,
        "title": campaign.title,
        "original_url": campaign.original_url,
        "platform_type": campaign.platform_type,
        "campaign_type": campaign.campaign_type,
        "category_name": campaign.category_name,
        "subcategory_name": campaign.subcategory_name,
        "region_primary_name": campaign.region_primary_name,
        "region_secondary_name": campaign.region_secondary_name,
        "benefit_text": campaign.benefit_text,
        "recruit_count": campaign.recruit_count,
        "apply_deadline": campaign.apply_deadline,
        "published_at": campaign.published_at,
        "thumbnail_url": campaign.thumbnail_url,
        "snippet": campaign.snippet,
        "raw_status": campaign.raw_status,
        "status": campaign.status,
        "requires_review": campaign.requires_review,
        "last_seen_at": campaign.crawled_at,
    }


def run_source_pipeline(
    source_slug: str,
    config: AppConfig,
    source_file: str | None = None,
    dry_run: bool | None = None,
    delete_before_refresh: bool = False,
    report_mode: bool = False,
) -> dict[str, Any]:
    if source_slug not in SEEDED_SOURCES:
        raise KeyError(f"unknown source slug: {source_slug}")

    effective_dry_run = config.dry_run if dry_run is None else dry_run
    definition = SEEDED_SOURCES[source_slug]
    client = SupabasePostgrestClient(config) if config.supabase_url and config.supabase_service_role_key else None
    if client and not effective_dry_run:
        source_row = client.get_source_by_slug(source_slug)
        if source_row is None:
            source_row = client.upsert_source(
                definition,
                priority=_source_priority(source_slug),
                notes=_source_notes(source_slug),
            )
        if source_row is None:
            raise ValueError(f"source slug '{source_slug}' could not be ensured in Supabase sources table")
        definition = SourceDefinition(
            slug=definition.slug,
            name=definition.name,
            base_url=definition.base_url,
            platform_type=definition.platform_type,
            crawl_method=definition.crawl_method,
            source_id=source_row.get("id"),
        )

    adapter = get_adapter(source_slug, source_file, report_mode=report_mode)
    rows = adapter.fetch()
    stats = PipelineStats(fetched=len(rows))
    normalized: list[CampaignRecord] = []
    errors: list[str] = []
    deleted_count = 0
    job_row: dict[str, Any] | None = None
    today = _kst_today()

    for raw in rows:
        try:
            campaign = normalize_campaign(definition.slug, definition.source_id, raw)
            if _is_expired(campaign, today=today):
                stats.skipped += 1
                continue
            normalized.append(campaign)
            stats.normalized += 1
        except Exception as exc:
            stats.failed += 1
            errors.append(str(exc))

    payload = [build_campaign_payload(item) for item in normalized]
    if not effective_dry_run and client:
        created_job = client.create_crawl_job(
            definition.source_id,
            metadata={
                "source_slug": source_slug,
                "delete_before_refresh": delete_before_refresh,
                "source_file": source_file,
            },
        )
        if created_job:
            job_row = created_job[0]
        if definition.source_id:
            expired_rows = client.delete_expired_campaigns_for_source(definition.source_id, today=today.isoformat()) or []
            deleted_count += len(expired_rows)
        if delete_before_refresh and definition.source_id:
            deleted_rows = client.delete_campaigns_for_source(definition.source_id) or []
            deleted_count += len(deleted_rows)
        if payload:
            for batch in _iter_batches(payload, config.upsert_batch_size):
                client.upsert_campaigns(batch)
        if job_row and job_row.get("id"):
            client.update_crawl_job(
                job_row["id"],
                {
                    "job_status": "success" if not errors else "partial",
                    "fetched_count": stats.fetched,
                    "inserted_count": stats.normalized,
                    "updated_count": 0,
                    "skipped_count": stats.skipped,
                    "failed_count": stats.failed,
                    "error_summary": "\n".join(errors[:5]) if errors else None,
                    "finished_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                },
            )

    return {
        "source": definition.slug,
        "dry_run": effective_dry_run,
        "delete_before_refresh": delete_before_refresh,
        "report_mode": report_mode,
        "deleted_count": deleted_count,
        "stats": stats,
        "payload": payload,
        "errors": errors,
    }


def run_daily_refresh(
    source_slugs: list[str],
    config: AppConfig,
    source_file_dir: str | None = None,
    dry_run: bool | None = None,
    delete_before_refresh: bool = True,
    report_mode: bool = False,
) -> dict[str, Any]:
    results: list[dict[str, Any]] = []
    totals = {"fetched": 0, "normalized": 0, "failed": 0, "deleted": 0}

    for slug in source_slugs:
        source_file = None
        if source_file_dir:
            source_file = f"{source_file_dir.rstrip('/')}/{slug}.json"
        result = run_source_pipeline(
            slug,
            config,
            source_file=source_file,
            dry_run=dry_run,
            delete_before_refresh=delete_before_refresh,
            report_mode=report_mode,
        )
        results.append(result)
        totals["fetched"] += result["stats"].fetched
        totals["normalized"] += result["stats"].normalized
        totals["failed"] += result["stats"].failed
        totals["deleted"] += result["deleted_count"]

    return {
        "mode": "daily-refresh",
        "sources": source_slugs,
        "delete_before_refresh": delete_before_refresh,
        "report_mode": report_mode,
        "dry_run": config.dry_run if dry_run is None else dry_run,
        "totals": totals,
        "results": results,
    }
