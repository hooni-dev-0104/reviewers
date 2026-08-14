from __future__ import annotations

import argparse
import json
from pathlib import Path

from crawler.config import AppConfig
from crawler.pipeline import run_daily_refresh, run_source_pipeline
from crawler.reporting import PUBLIC_SOURCE_SLUGS, build_source_quality_report
from crawler.sources.seeded import SEEDED_SOURCES, list_seeded_sources


def _serialize_stats(stats) -> dict[str, int]:
    return {
        "fetched": int(getattr(stats, "fetched", 0)),
        "normalized": int(getattr(stats, "normalized", 0)),
        "failed": int(getattr(stats, "failed", 0)),
        "skipped": int(getattr(stats, "skipped", 0)),
    }


def build_output_payload(result: dict, verbose: bool = False) -> dict:
    payload = {
        "source": result.get("source"),
        "mode": result.get("mode"),
        "sources": result.get("sources"),
        "dry_run": result.get("dry_run"),
        "delete_before_refresh": result.get("delete_before_refresh"),
        "report_mode": result.get("report_mode"),
        "deleted_count": result.get("deleted_count"),
        "totals": result.get("totals"),
        "errors": result.get("errors", []),
        "results": result.get("results"),
    }
    if "stats" in result and result.get("stats") is not None:
        payload["stats"] = _serialize_stats(result["stats"])
    if "results" in result and isinstance(result.get("results"), list):
        payload["results"] = [
            {
                **{k: v for k, v in item.items() if k not in {"payload", "stats"}},
                "stats": _serialize_stats(item["stats"]),
                **({"payload": item.get("payload", [])} if verbose else {"payload_count": len(item.get("payload", []))}),
            }
            for item in result["results"]
        ]
    elif verbose:
        payload["payload"] = result.get("payload", [])
    else:
        payload["payload_count"] = len(result.get("payload", []))
    return {key: value for key, value in payload.items() if value is not None}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Crawler MVP CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list-sources", help="List seeded source definitions")

    run_parser = sub.add_parser("run-source", help="Run one source pipeline")
    run_parser.add_argument("source_slug")
    run_parser.add_argument("--source-file", help="JSON array file for offline/local runs")
    run_parser.add_argument("--dry-run", action="store_true", help="Force dry-run mode")
    run_parser.add_argument("--write", action="store_true", help="Force write mode if env is configured")
    run_parser.add_argument(
        "--delete-before-refresh",
        action="store_true",
        help="Delete existing campaigns for the same source before re-inserting refreshed rows",
    )
    run_parser.add_argument("--verbose", action="store_true", help="Emit the full normalized payload")

    for command_name, help_text in (
        ("run-daily", "Run daily refresh for one or more sources"),
        ("run-scheduled", "Run scheduled refresh for one or more sources"),
    ):
        scheduled_parser = sub.add_parser(command_name, help=help_text)
        scheduled_parser.add_argument("--all", action="store_true", help="Run all seeded sources")
        scheduled_parser.add_argument(
            "--source", action="append", dest="sources", help="Specific source slug to run"
        )
        scheduled_parser.add_argument(
        "--source-file-dir",
        help="Directory containing per-source JSON files named <slug>.json for offline runs",
        )
        scheduled_parser.add_argument("--dry-run", action="store_true", help="Force dry-run mode")
        scheduled_parser.add_argument(
            "--write", action="store_true", help="Force write mode if env is configured"
        )
        scheduled_parser.add_argument(
            "--delete-before-refresh",
            action="store_true",
            help="Delete existing campaigns for each source before re-inserting refreshed rows",
        )
        scheduled_parser.add_argument("--verbose", action="store_true", help="Emit the full normalized payload")

    report_parser = sub.add_parser("run-report", help="Run a scheduled dry-run and emit a markdown quality report")
    report_parser.add_argument("--all-public", action="store_true", help="Run the current public parser set")
    report_parser.add_argument("--source", action="append", dest="sources", help="Specific source slug to include")
    report_parser.add_argument("--source-file-dir", help="Directory containing per-source JSON files named <slug>.json")
    report_parser.add_argument("--output", help="Optional markdown output path")
    report_parser.add_argument(
        "--delete-before-refresh",
        action="store_true",
        help="Delete existing campaigns for each source before re-inserting refreshed rows",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    config = AppConfig.from_env()

    if args.command == "list-sources":
        for source in list_seeded_sources():
            print(f"{source.slug}\t{source.name}\t{source.crawl_method}\t{source.base_url}")
        return 0

    if args.command == "run-source":
        dry_run = True
        if args.write:
            dry_run = False
        elif args.dry_run:
            dry_run = True
        result = run_source_pipeline(
            args.source_slug,
            config,
            source_file=args.source_file,
            dry_run=dry_run,
            delete_before_refresh=args.delete_before_refresh,
        )
        print(json.dumps(build_output_payload(result, verbose=args.verbose), ensure_ascii=False, indent=2))
        return 0

    if args.command in {"run-daily", "run-scheduled"}:
        dry_run = True
        if args.write:
            dry_run = False
        elif args.dry_run:
            dry_run = True
        source_slugs = sorted(SEEDED_SOURCES.keys()) if args.all else (args.sources or [])
        if not source_slugs:
            parser.error("run-daily requires --all or at least one --source")
        result = run_daily_refresh(
            source_slugs,
            config,
            source_file_dir=args.source_file_dir,
            dry_run=dry_run,
            delete_before_refresh=args.delete_before_refresh,
        )
        print(json.dumps(build_output_payload(result, verbose=args.verbose), ensure_ascii=False, indent=2))
        return 0

    if args.command == "run-report":
        source_slugs = PUBLIC_SOURCE_SLUGS[:] if args.all_public else (args.sources or [])
        if not source_slugs:
            parser.error("run-report requires --all-public or at least one --source")
        result = run_daily_refresh(
            source_slugs,
            config,
            source_file_dir=args.source_file_dir,
            dry_run=True,
            delete_before_refresh=args.delete_before_refresh,
            report_mode=True,
        )
        report = build_source_quality_report(result)
        if args.output:
            Path(args.output).write_text(report, encoding="utf-8")
        print(report)
        return 0

    parser.error("unknown command")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
