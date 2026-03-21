from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _load_dotenv(path: str | Path = ".env") -> None:
    env_path = Path(path)
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        raw = line.strip()
        if not raw or raw.startswith("#") or "=" not in raw:
            continue
        key, value = raw.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class AppConfig:
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    revu_access_token: str = ""
    revu_username: str = ""
    revu_password: str = ""
    schema: str = "public"
    sources_table: str = "sources"
    campaigns_table: str = "campaigns"
    crawl_jobs_table: str = "crawl_jobs"
    crawl_errors_table: str = "crawl_errors"
    campaign_snapshots_table: str = "campaign_snapshots"
    dry_run: bool = True

    @classmethod
    def from_env(cls, env_path: str | Path = ".env") -> "AppConfig":
        _load_dotenv(env_path)
        return cls(
            supabase_url=os.getenv("SUPABASE_URL", "").rstrip("/"),
            supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
            revu_access_token=os.getenv("REVU_ACCESS_TOKEN", ""),
            revu_username=os.getenv("REVU_USERNAME", ""),
            revu_password=os.getenv("REVU_PASSWORD", ""),
            schema=os.getenv("SUPABASE_SCHEMA", "public"),
            sources_table=os.getenv("SUPABASE_SOURCES_TABLE", "sources"),
            campaigns_table=os.getenv("SUPABASE_CAMPAIGNS_TABLE", "campaigns"),
            crawl_jobs_table=os.getenv("SUPABASE_CRAWL_JOBS_TABLE", "crawl_jobs"),
            crawl_errors_table=os.getenv("SUPABASE_CRAWL_ERRORS_TABLE", "crawl_errors"),
            campaign_snapshots_table=os.getenv(
                "SUPABASE_CAMPAIGN_SNAPSHOTS_TABLE", "campaign_snapshots"
            ),
            dry_run=_as_bool(os.getenv("CRAWLER_DRY_RUN"), default=True),
        )

    @property
    def can_write(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key and not self.dry_run)
