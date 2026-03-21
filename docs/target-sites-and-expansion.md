# Target Sites and Expansion Draft

## Purpose
This draft turns the seeded Supabase source catalog into an execution-ready sourcing plan for the Korean experience-campaign aggregator. It is grounded in `supabase_crawler_schema.sql`, especially the `sources`, `source_policies`, `campaigns`, `crawl_jobs`, and `crawl_errors` tables.

## MVP source set (phase 1)
The current schema already seeds five MVP sources in `public.sources`:

| Source | Slug | Base URL | Platform type | Crawl method | MVP fit |
| --- | --- | --- | --- | --- | --- |
| 리뷰노트 | `reviewnote` | `https://www.reviewnote.co.kr` | `mixed` | `dynamic` | High-priority broad marketplace; strong candidate for diverse blog/social campaigns. |
| 레뷰 | `revu` | `https://www.revu.net` | `mixed` | `dynamic` | Large mixed-format supply; good for validating normalization across multiple campaign types. |
| 디너의여왕 | `dinnerqueen` | `https://dinnerqueen.net` | `mixed` | `static` | Good early source for restaurant/cafe-heavy campaigns with simpler fetch mechanics. |
| 미블 | `mrblog` | `https://www.mrblog.net` | `mixed` | `dynamic` | Important dynamic source for testing login/session handling and richer extraction flows. |
| 포블로그 | `4blog` | `https://4blog.net` | `blog` | `static` | Blog-focused source that can stabilize the first static ingestion pipeline. |

## Why these five belong in MVP
1. They already exist as seeded records, so the current schema, slugs, and source priority ordering assume them.
2. They cover both `static` and `dynamic` crawl methods, which is enough to validate the crawler split without prematurely supporting every site pattern.
3. They span `blog` and `mixed` platform types, which exercises normalization into `campaigns.platform_type` and `campaigns.campaign_type`.
4. Their seeded priorities (`10` through `50`) imply an intended rollout order and create a natural first operating backlog.

## Recommended MVP rollout order
1. **리뷰노트** — highest seeded priority; use as the primary dynamic-source proving ground.
2. **레뷰** — second dynamic source to validate repeatability and cross-site normalization.
3. **디너의여왕** — first static source to prove lower-friction fetch + parse flow.
4. **미블** — second dynamic source after basic session, retry, and review workflows are stable.
5. **포블로그** — final MVP stabilizer for blog-specific static ingestion and comparison.

## Source onboarding checklist
Use this checklist before moving any source from planned to active crawling.

### 1) Source record readiness (`public.sources`)
- Confirm `name`, `slug`, `base_url`, and `homepage_url` are canonical.
- Set the intended `platform_type` (`blog`, `instagram`, `youtube`, `mixed`, `etc`).
- Set the intended `crawl_method` (`manual`, `static`, `dynamic`, `hybrid`).
- Assign `priority` relative to current intake queue.
- Fill `robots_url` and `terms_url` when available.
- Record planning notes in `notes`.
- Leave `is_active = false` until policy and extraction checks pass.

### 2) Policy review (`public.source_policies`)
- Create one `source_policies` row per source.
- Review whether login is required (`login_required`).
- Record robots stance in `robots_allowed`.
- Record whether excerpts and images are allowed (`excerpt_allowed`, `image_allowed`).
- Capture any throttling constraints in `rate_limit_note`.
- Set `policy_status` to `allowed`, `restricted`, `pending`, or `blocked`.
- Add `reviewed_at` and `review_note` once a human review is complete.

### 3) Extraction readiness
- Identify list page URLs and detail page URL patterns.
- Define the mapping for required campaign fields: title, category, region, benefit, recruit count, deadline, original URL, thumbnail, snippet, and raw status.
- Decide whether the first pass should set `requires_review = true` for all inserted campaigns.
- Define dedupe behavior against the unique key `(source_id, original_url)`.

### 4) Operations readiness
- Confirm crawl job metadata to log selector versions, pagination depth, and runtime mode.
- Define retry thresholds and what should write to `crawl_errors`.
- Confirm first-run success criteria: fetched rows, inserted rows, updated rows, skipped rows, and failed rows.

### 5) Launch gate
Activate `sources.is_active` only when:
- policy status is not `blocked`,
- extraction produces stable `original_url` values,
- the crawler can populate required `campaigns` fields,
- job/error logging is visible in `crawl_jobs` and `crawl_errors`, and
- at least one manual QA pass confirms usable downstream records.

## Source scoring model for expansion
Use a 100-point weighted score to rank candidate sources before adding them.

| Dimension | Weight | What to measure |
| --- | ---: | --- |
| Campaign yield potential | 25 | Expected listing volume and posting frequency. |
| Crawl feasibility | 20 | Static vs dynamic complexity, anti-bot friction, pagination clarity. |
| Policy safety | 20 | Robots/terms clarity, media reuse constraints, login requirements. |
| Data quality | 15 | Completeness of title, deadline, benefit, category, and region fields. |
| Marketplace coverage | 10 | Whether the source expands platform, region, or category coverage meaningfully. |
| Operational cost | 10 | Expected maintenance burden, fragility, and incident frequency. |

### Suggested scoring rubric
- **90-100**: Add to the next expansion wave.
- **75-89**: Good candidate after one successful prior wave.
- **60-74**: Keep in backlog; revisit once crawler abstractions improve.
- **Below 60**: Reject or leave parked until policy/engineering conditions change.

### Required scoring notes per candidate
Store these as planning notes even if they are not yet in the schema:
- sample listing count observed,
- content formats supported,
- login wall severity,
- robots/terms review result,
- estimated parser maintenance cost,
- categories/regions uniquely added beyond current sources.

## Phase-by-phase expansion plan

### Phase 1 — Seeded MVP stabilization
**Goal:** make the five seeded sources operational.
- Deliver at least one stable static source and one stable dynamic source.
- Validate campaign normalization into categories, regions, deadlines, and benefits.
- Use `crawl_jobs` / `crawl_errors` to establish baseline observability.

**Exit criteria**
- At least 3 sources produce repeatable successful jobs.
- Duplicate prevention via `(source_id, original_url)` works.
- Snapshot history is captured for updates on changed campaigns.

### Phase 2 — Category and region depth
**Goal:** add sources that improve breadth in hospitality, beauty, lifestyle, and non-Seoul regions.
- Prefer sources with clear category taxonomy and location metadata.
- Prioritize sources that reduce over-reliance on mixed-format marketplaces.

**Exit criteria**
- New sources improve at least one weak category or region coverage area.
- Source onboarding checklist can be completed with low manual intervention.

### Phase 3 — Platform diversification
**Goal:** expand into sources with stronger Instagram, YouTube, TikTok, or hybrid creator workflows.
- Use only after the team can reliably normalize `platform_type` and `campaign_type` beyond blog-heavy sources.
- Expect higher review rates and more complicated policy controls.

**Exit criteria**
- The crawler and review flow handle non-blog campaigns without schema churn.
- Policy review process is fast enough to keep pace with new platform additions.

### Phase 4 — Long-tail and partner intake
**Goal:** support smaller or niche sources with lower priority but unique supply.
- Add only sources scoring well on policy safety and operational cost.
- Keep these behind stricter launch gates and shorter review cycles.

**Exit criteria**
- Onboarding is repeatable enough to process new sources in batches.
- The incident rate from smaller sources stays within operational budget.

## Recommended operating heuristics
- Prefer static sources first when campaign quality is acceptable; they create cheaper reliability wins.
- Use dynamic sources to validate core abstractions, not to maximize source count too early.
- Add new sources only when they clearly improve category, region, or platform coverage.
- Keep risky sources visible in planning, but do not activate them until policy review is explicit.
- Preserve source-level notes and policy decisions so future operators do not re-investigate the same site.

## Handoff note
This draft is planner-owned and ready to be promoted into `docs/target-sites-and-expansion.md` by the lead or a documentation/execution worker.
