from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any

from crawler.config import AppConfig
from crawler.models import SourceDefinition


class SupabaseRequestError(RuntimeError):
    pass


@dataclass(frozen=True)
class RequestSpec:
    method: str
    url: str
    headers: dict[str, str]
    body: bytes | None = None


def build_upsert_campaigns_request(config: AppConfig, payload: list[dict[str, Any]]) -> RequestSpec:
    if not config.supabase_url or not config.supabase_service_role_key:
        raise ValueError("Supabase URL and service role key are required for write requests")

    query = urllib.parse.urlencode({"on_conflict": "source_id,original_url"})
    url = f"{config.supabase_url}/rest/v1/{config.campaigns_table}?{query}"
    headers = {
        "apikey": config.supabase_service_role_key,
        "Authorization": f"Bearer {config.supabase_service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation",
    }
    return RequestSpec("POST", url, headers, json.dumps(payload, ensure_ascii=False).encode("utf-8"))


def _kst_today() -> str:
    kst = timezone(timedelta(hours=9))
    return datetime.now(kst).date().isoformat()


class SupabasePostgrestClient:
    def __init__(self, config: AppConfig):
        self.config = config

    def _request(self, spec: RequestSpec) -> Any:
        req = urllib.request.Request(spec.url, data=spec.body, headers=spec.headers, method=spec.method)
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                raw = response.read().decode("utf-8")
                return json.loads(raw) if raw else None
        except Exception as exc:  # pragma: no cover - network path
            raise SupabaseRequestError(str(exc)) from exc

    def upsert_campaigns(self, payload: list[dict[str, Any]]) -> Any:
        return self._request(build_upsert_campaigns_request(self.config, payload))

    def insert_campaign_snapshots(self, payload: list[dict[str, Any]]) -> Any:
        if not payload:
            return []
        spec = RequestSpec(
            method="POST",
            url=f"{self.config.supabase_url}/rest/v1/{self.config.campaign_snapshots_table}",
            headers={
                "apikey": self.config.supabase_service_role_key,
                "Authorization": f"Bearer {self.config.supabase_service_role_key}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
            body=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        )
        return self._request(spec)

    def get_source_by_slug(self, slug: str) -> dict[str, Any] | None:
        query = urllib.parse.urlencode({"slug": f"eq.{slug}", "select": "*", "limit": "1"})
        spec = RequestSpec(
            method="GET",
            url=f"{self.config.supabase_url}/rest/v1/{self.config.sources_table}?{query}",
            headers={
                "apikey": self.config.supabase_service_role_key,
                "Authorization": f"Bearer {self.config.supabase_service_role_key}",
            },
        )
        result = self._request(spec)
        return result[0] if result else None

    def upsert_source(self, definition: SourceDefinition, priority: int = 100, notes: str | None = None) -> dict[str, Any] | None:
        query = urllib.parse.urlencode({"on_conflict": "slug"})
        payload = {
            "name": definition.name,
            "slug": definition.slug,
            "base_url": definition.base_url,
            "homepage_url": definition.base_url,
            "platform_type": definition.platform_type,
            "crawl_method": definition.crawl_method,
            "priority": priority,
            "notes": notes,
        }
        spec = RequestSpec(
            method="POST",
            url=f"{self.config.supabase_url}/rest/v1/{self.config.sources_table}?{query}",
            headers={
                "apikey": self.config.supabase_service_role_key,
                "Authorization": f"Bearer {self.config.supabase_service_role_key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=representation",
            },
            body=json.dumps([payload], ensure_ascii=False).encode("utf-8"),
        )
        result = self._request(spec)
        return result[0] if result else None

    def delete_campaigns_for_source(self, source_id: str) -> Any:
        query = urllib.parse.urlencode({"source_id": f"eq.{source_id}"})
        spec = RequestSpec(
            method="DELETE",
            url=f"{self.config.supabase_url}/rest/v1/{self.config.campaigns_table}?{query}",
            headers={
                "apikey": self.config.supabase_service_role_key,
                "Authorization": f"Bearer {self.config.supabase_service_role_key}",
                "Prefer": "return=representation",
            },
        )
        return self._request(spec)

    def delete_expired_campaigns_for_source(self, source_id: str, today: str | None = None) -> Any:
        today = today or _kst_today()
        query = urllib.parse.urlencode(
            {
                "source_id": f"eq.{source_id}",
                "or": f"(status.eq.expired,apply_deadline.lt.{today})",
            }
        )
        spec = RequestSpec(
            method="DELETE",
            url=f"{self.config.supabase_url}/rest/v1/{self.config.campaigns_table}?{query}",
            headers={
                "apikey": self.config.supabase_service_role_key,
                "Authorization": f"Bearer {self.config.supabase_service_role_key}",
                "Prefer": "return=representation",
            },
        )
        return self._request(spec)

    def update_crawl_job(self, job_id: str, fields: dict[str, Any]) -> Any:
        query = urllib.parse.urlencode({"id": f"eq.{job_id}"})
        spec = RequestSpec(
            method="PATCH",
            url=f"{self.config.supabase_url}/rest/v1/{self.config.crawl_jobs_table}?{query}",
            headers={
                "apikey": self.config.supabase_service_role_key,
                "Authorization": f"Bearer {self.config.supabase_service_role_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
            body=json.dumps(fields, ensure_ascii=False).encode("utf-8"),
        )
        return self._request(spec)

    def create_crawl_job(self, source_id: str | None, metadata: dict[str, Any] | None = None) -> Any:
        spec = RequestSpec(
            method="POST",
            url=f"{self.config.supabase_url}/rest/v1/{self.config.crawl_jobs_table}",
            headers={
                "apikey": self.config.supabase_service_role_key,
                "Authorization": f"Bearer {self.config.supabase_service_role_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
            body=json.dumps(
                {
                    "source_id": source_id,
                    "job_status": "running",
                    "metadata": metadata or {},
                }
            ).encode("utf-8"),
        )
        return self._request(spec)
