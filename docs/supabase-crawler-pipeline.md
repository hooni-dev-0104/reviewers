# Supabase Crawler Pipeline Draft

## Purpose
This draft describes how a crawler should use the current Supabase schema to ingest, normalize, observe, and operate Korean experience-campaign listings. It is grounded in `supabase_crawler_schema.sql` and assumes the schema is the current source of truth.

## Pipeline overview
The intended crawl pipeline is:
1. select an active source from `public.sources`,
2. verify source policy readiness in `public.source_policies`,
3. create a `public.crawl_jobs` row,
4. fetch and parse source listings,
5. upsert canonical records into `public.campaigns`,
6. write change history into `public.campaign_snapshots` when campaign state changes,
7. record row-level failures in `public.crawl_errors`, and
8. finalize the job with aggregate counts and an outcome in `public.crawl_jobs`.

## Table roles in the pipeline

### `public.sources`
Use this table as the source registry and crawl scheduler input.
- `is_active` gates whether the source should be scheduled.
- `priority` defines crawl order.
- `platform_type` and `crawl_method` select the parser/runtime path.
- `robots_url`, `terms_url`, `risk_level`, and `notes` support human review before activation.

### `public.source_policies`
Use this table as the source compliance gate.
- One row per source (`source_id` is unique).
- Review `login_required`, `robots_allowed`, `excerpt_allowed`, `image_allowed`, and `policy_status` before launching or expanding a source.
- If `policy_status = 'blocked'`, the scheduler should skip the source and avoid creating a normal crawl run.

### `public.crawl_jobs`
Use this table as the run ledger.
- Create one row at crawl start.
- Set `job_status` through `queued`, `running`, then `success`, `failed`, `partial`, or `cancelled`.
- Update `started_at`, `finished_at`, and aggregate counters (`fetched_count`, `inserted_count`, `updated_count`, `skipped_count`, `failed_count`).
- Store operational metadata in `metadata` such as crawler version, pagination depth, selector version, or request mode.
- Use `error_summary` for a short operator-facing explanation of failures.

### `public.campaigns`
Use this table as the canonical live record store.
- Deduplicate by the unique key `(source_id, original_url)`.
- Populate normalized discovery fields: category, region, platform type, campaign type, benefit text, recruit count, deadline, status, and snippet.
- Keep `first_seen_at` stable on first insert and update `last_seen_at` on each successful re-observation.
- Use `requires_review` to flag records whose extraction is incomplete or suspicious.

### `public.campaign_snapshots`
Use this table for point-in-time change tracking.
- Write a snapshot after insert if you want a full first-seen history, or at minimum whenever monitored campaign fields materially change.
- The schema supports tracking `title`, `benefit_text`, `apply_deadline`, `status`, `raw_payload`, and `crawled_at`.
- This table is the historical audit trail that explains why a campaign changed between runs.

### `public.crawl_errors`
Use this table as the structured failure sink.
- Record row-level or URL-level failures linked to `crawl_job_id` when possible.
- Include `source_id`, `original_url`, `error_type`, `error_message`, and structured `payload` details.
- Use this table for parser failures, bad detail pages, validation failures, and retry exhaustion.

## End-to-end crawl flow

### 1) Source selection
- Query active sources ordered by `priority`.
- Skip sources whose policy review is missing or blocked.
- Use `crawl_method` to choose the runtime lane: `static`, `dynamic`, `manual`, or `hybrid`.

### 2) Job initialization
Insert a `crawl_jobs` row with:
- `source_id`,
- `job_status = 'queued'` or `running`,
- zeroed counters,
- metadata describing the intended run.

When the crawler starts issuing requests, set:
- `job_status = 'running'`,
- `started_at = now()`.

### 3) Fetch and parse
For each listing or detail page:
- increment the in-memory fetched count,
- extract the normalized fields required by `public.campaigns`,
- preserve the raw source payload for downstream debugging or snapshotting,
- decide whether the record is trusted enough to set `requires_review = false`.

### 4) Canonical upsert into `public.campaigns`
Use `(source_id, original_url)` as the idempotency key.

**Insert when** no existing record matches the source + URL pair.
- Set `first_seen_at` and `last_seen_at` to the current crawl time.
- Increment `inserted_count`.

**Update when** the record already exists and one or more mutable fields changed.
- Preserve `first_seen_at`.
- Update mutable fields such as `title`, category/region names and IDs, `benefit_text`, `recruit_count`, `apply_deadline`, `published_at`, `thumbnail_url`, `snippet`, `raw_status`, `status`, `requires_review`, and `last_seen_at`.
- Let the trigger maintain `updated_at`.
- Increment `updated_count`.

**Skip when** the canonical record is unchanged.
- Still refresh `last_seen_at` if the business wants evidence that the listing was observed again.
- Increment `skipped_count` when no meaningful mutation is needed.

### 5) Snapshot rules
Write to `public.campaign_snapshots` when any of the following changes:
- `title`,
- `benefit_text`,
- `apply_deadline`,
- `status`, or
- any source payload that matters for audit/debug use.

Recommended practice:
- always snapshot first insert if storage cost is acceptable,
- otherwise snapshot on update-only events,
- include the latest raw source payload in `raw_payload`, and
- set `crawled_at` to the crawl timestamp, not the source publish time.

### 6) Error handling
Create `crawl_errors` rows when:
- a listing URL cannot be fetched,
- detail parsing fails,
- validation fails for a required canonical field,
- the source returns unexpected structure,
- a retry budget is exhausted.

Recommended error typing:
- `network_error`
- `parse_error`
- `validation_error`
- `policy_error`
- `upsert_error`

Each error row should preserve enough payload context to replay or inspect the failure without re-crawling blindly.

### 7) Job finalization
At the end of the run:
- set `finished_at`,
- persist aggregate counters,
- set `job_status` to:
  - `success` if the run completed without material failures,
  - `partial` if some rows failed but useful data was ingested,
  - `failed` if the source run did not produce trustworthy output,
  - `cancelled` if intentionally aborted.
- fill `error_summary` when the final state is not `success`.

## Practical upsert rules

### Canonical key
- Canonical uniqueness = `(source_id, original_url)`.
- Do not key on title alone; titles can change while URLs stay stable.

### Timestamp rules
- `first_seen_at`: set once on insert.
- `last_seen_at`: refresh on every successful observation.
- `updated_at`: rely on the table trigger.
- snapshot `crawled_at`: use the crawl event time.

### Status rules
- Use source-specific raw values in `raw_status`.
- Normalize public status into `active`, `expired`, `removed`, `hidden`, or `draft`.
- If a campaign previously existed and disappears temporarily, avoid marking it `removed` until the source-specific retention rule is clear.

### Review rules
- Set `requires_review = true` when category mapping, region mapping, benefit extraction, or status normalization is uncertain.
- Review-heavy sources should still write canonical rows so operators can resolve them later.

## Operator checklist
Before a new source goes live:
- confirm `sources.is_active` should be enabled,
- confirm `source_policies.policy_status` is not `blocked`,
- verify the parser can derive `original_url`, title, and at least one useful benefit/deadline field,
- define metadata fields to capture in `crawl_jobs.metadata`.

During a run:
- monitor `crawl_jobs.job_status`, `started_at`, and aggregate counters,
- inspect `crawl_errors` for spikes by source or error type,
- verify `inserted_count + updated_count + skipped_count + failed_count` explains `fetched_count` closely enough for the source behavior.

After a run:
- review `error_summary` on non-success jobs,
- sample updated `campaigns` rows for normalization quality,
- verify `campaign_snapshots` exists for materially changed campaigns,
- decide whether high `requires_review` rates indicate parser regressions.

## Recommended operating heuristics
- Start with one source per job for clean accountability.
- Prefer `partial` over `success` when row-level failures are meaningful.
- Keep job metadata rich enough to compare parser versions over time.
- Use `crawl_errors` for structured diagnostics; avoid burying everything in `error_summary`.
- Treat snapshot storage as an audit feature, not an afterthought.

## Handoff note
This draft is planner-owned and ready to be promoted into `docs/supabase-crawler-pipeline.md` by the lead or an execution/doc lane.
