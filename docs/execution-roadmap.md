# Execution Roadmap

## Objective
Turn the current Supabase schema for a Korean experience-campaign aggregator into an MVP that can ingest five priority source sites, normalize campaign records, and expose a reliable operator workflow for ongoing source expansion.

## Current Starting Point
The repository currently contains the database foundation in `supabase_crawler_schema.sql`:
- source registry and policy review tables (`sources`, `source_policies`)
- normalized taxonomy tables (`categories`, `regions`)
- campaign storage and history (`campaigns`, `campaign_snapshots`)
- crawler observability tables (`crawl_jobs`, `crawl_errors`)
- baseline seed data for five MVP sources and initial category/region values

That makes the next phase primarily an application + operations buildout rather than further schema design.

## Milestone 1 — Provision Supabase project and apply schema safely
**Goal:** Stand up a working Supabase environment where the schema, triggers, policies, indexes, and seed data are applied exactly once and can be re-applied safely.

**Key work:**
- create environment configuration for local/staging/prod Supabase projects
- apply `supabase_crawler_schema.sql` via migration workflow
- validate seeded sources/categories/regions and RLS behavior
- document secrets ownership and migration promotion steps

**Acceptance criteria:**
- a fresh Supabase project can apply the schema without manual SQL edits
- all eight tables, triggers, indexes, and RLS policies exist after migration
- the five seeded MVP sources are present with expected `slug`, `crawl_method`, and `priority` values
- the team has a repeatable migration command for local and hosted environments

**Primary risks:**
- schema drift if manual dashboard edits happen outside migrations
- RLS misconfiguration could block crawler writes or expose unintended tables
- environment secrets may be scattered before an operator checklist exists

## Milestone 2 — Build source-onboarding and policy-review workflow
**Goal:** Make each target site reviewable and operable before crawler code is written at scale.

**Key work:**
- define a source onboarding template using `sources` + `source_policies`
- verify robots, login requirements, excerpt/image allowances, and rate-limit notes for the five MVP sites
- create a lightweight manual review routine for risk-level changes (`pending` -> `low`/`medium`/`blocked`)
- establish go/no-go criteria for adding additional Korean campaign sites

**Acceptance criteria:**
- each MVP source has a reviewed policy record with explicit allow/restrict/pending notes
- blocked or uncertain sources can be excluded operationally without schema changes
- onboarding for a new source can be completed from a checklist in under 30 minutes
- expansion decisions can be prioritized by source risk, value, and implementation effort

**Primary risks:**
- legal/policy ambiguity can stall implementation even if engineering is ready
- dynamic sites may require authenticated or browser-driven access not reflected in early estimates
- lack of consistent review notes may force repeated source analysis later

## Milestone 3 — Implement normalized crawler ingestion contract
**Goal:** Build the first crawler/runtime contract that maps raw source pages into the normalized campaign model.

**Key work:**
- define the raw-to-normalized field mapping for title, benefit, campaign type, platform type, region, category, deadline, and canonical URL
- enforce source-level dedupe using `(source_id, original_url)`
- set rules for `first_seen_at`, `last_seen_at`, `status`, `requires_review`, and partial-field fallback behavior
- decide which sources start as static scraping versus dynamic/browser scraping

**Acceptance criteria:**
- one ingestion contract exists that every source adapter must satisfy before writing to `campaigns`
- crawler runs can insert new campaigns and update existing campaigns idempotently
- incomplete or ambiguous records are marked for review instead of silently corrupting normalized fields
- platform/campaign/category/region values map cleanly into the schema’s allowed enums and reference tables

**Primary risks:**
- heterogeneous source markup may make normalization slower than expected
- region/category naming drift across sites can cause inconsistent taxonomy mapping
- overly strict validation may discard useful campaigns; overly loose validation may degrade search quality

## Milestone 4 — Add snapshots, job telemetry, and failure handling
**Goal:** Make crawler activity observable enough for daily operations and safe iteration.

**Key work:**
- write snapshot rows whenever material campaign fields change
- record crawler run lifecycle in `crawl_jobs`
- capture per-record failures in `crawl_errors` with enough payload detail for debugging
- define retry and partial-success behavior for unstable sources

**Acceptance criteria:**
- every crawler run produces a `crawl_jobs` record with accurate inserted/updated/skipped/failed counters
- campaign changes create usable history in `campaign_snapshots`
- failed records can be traced to source URL, error type, and payload context within one query
- operators can distinguish source outage, parser drift, and data-quality failures without reading application logs first

**Primary risks:**
- missing telemetry will hide parser regressions until data quality drops
- excessive snapshot volume could create storage noise if change thresholds are not defined
- poor error taxonomy will make repeated incidents hard to triage

## Milestone 5 — Ship operator workflow for review, expiry, and replay
**Goal:** Close the loop between automated crawling and human supervision for an MVP launch.

**Key work:**
- define operator views/queries for active, expired, hidden, and review-required campaigns
- add replay/backfill procedure for a single source after parser updates
- create campaign QA checklist for benefit text, deadline accuracy, category mapping, and duplicate suppression
- define incident handling for blocked sources, failed jobs, and abnormal volume changes

**Acceptance criteria:**
- an operator can review suspicious campaigns and resolve them without direct database forensics
- a single source can be replayed safely without duplicating active records
- expiry behavior is documented and tied to `last_seen_at` / `status` updates
- the team has a launch checklist for daily crawl review and weekly source-quality audits

**Primary risks:**
- no operator loop means bad normalized data will persist unnoticed
- replay without guardrails can overwrite good data or create duplicate histories
- unclear expiry rules may leave stale campaigns visible too long

## Milestone 6 — Expand from the 5 MVP sources to phased growth
**Goal:** Use the proven ingestion + operations loop to onboard the next tranche of Korean campaign sources with controlled risk.

**Key work:**
- score expansion candidates by traffic/value, parser complexity, policy risk, and taxonomy fit
- separate sources into static, dynamic, and high-risk onboarding lanes
- reuse the onboarding and ingestion contract from Milestones 2-5 for each new source
- define a freeze rule: expansion pauses if crawl quality or operator load exceeds thresholds

**Acceptance criteria:**
- the five seeded MVP sources are live or explicitly blocked with rationale
- the next 5-10 candidate sources are ranked with an execution lane and risk note
- each new source can be estimated from the same checklist and ingestion contract
- expansion does not begin until MVP run quality is stable for an agreed observation window

**Primary risks:**
- source expansion before MVP stability will multiply parser and ops debt
- high-variance site structures may demand per-source maintenance overhead
- operator workload may grow faster than automation quality

## Recommended execution order
1. Milestone 1 — environment + schema deployment
2. Milestone 2 — policy review and source onboarding gate
3. Milestone 3 — normalized ingestion contract
4. Milestone 4 — telemetry, snapshots, and failure handling
5. Milestone 5 — operator review/replay workflow
6. Milestone 6 — phased source expansion

## Suggested exit gate before public MVP launch
Proceed to launch only when:
- all five seeded MVP sources have policy status reviewed
- at least one full crawl cycle can complete with accurate job/error telemetry
- duplicate suppression and snapshot history behave as expected on re-runs
- operators can review and replay one source without ad hoc SQL changes
- data quality for category/region/deadline normalization is stable across the MVP set
