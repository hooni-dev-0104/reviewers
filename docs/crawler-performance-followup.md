# Crawler Performance Follow-up

_Updated: 2026-03-29_

## Context

The crawler now covers more public sources, including heavier multi-page adapters such as `modan`, `seouloppa`, `ringble`, `gangnammatzip`, and `nolowa`. As source count and detail-page fan-out grow, the next practical bottlenecks will be repeated HTML fetches, per-run dedupe cost, and serialized detail enrichment.

This document records **future** performance options only. No Redis dependency is introduced in the current implementation.

## Recommended Redis-backed improvements

### 1) Response cache for listing/detail HTML

Use Redis as a short-TTL response cache before each network fetch.

- key shape:
  - `crawler:html:<source_slug>:<sha256(url)>`
- value:
  - raw HTML payload
  - fetched timestamp
  - optional status code / cache metadata
- suggested TTL:
  - listing pages: `5-15 min`
  - detail pages: `30-120 min`

Why it helps:
- repeated dry-runs stop re-downloading identical list/detail pages
- parser debugging becomes faster
- unstable sites get fewer redundant hits

### 2) Per-run seen-url dedupe set

Move large in-memory dedupe sets into Redis when running many sources or distributed workers.

- key shape:
  - `crawler:seen:<job_id>:<source_slug>`
- Redis type:
  - `SET`

Why it helps:
- multi-process / multi-runner crawls can share dedupe state
- duplicate detail fetches can be suppressed across worker boundaries

### 3) Detail-page work queue

Split listing discovery and detail enrichment into separate stages.

- stage A:
  - collect listing rows
  - push unique detail URLs into Redis
- stage B:
  - worker pool consumes queued detail URLs
  - enriches payloads in parallel

Recommended Redis structures:
- `LIST` or `STREAM` for detail jobs
- `HASH` for job metadata
- `SET` for completed URLs

Why it helps:
- high-yield sources like `nolowa` can fan out detail fetches safely
- listing fetch stays fast even when detail pages are slow

### 4) Source-level rate limiting and backoff tokens

Add Redis counters/leases to coordinate crawl pressure.

- key shape:
  - `crawler:rate:<source_slug>`
  - `crawler:lock:<source_slug>`

Why it helps:
- avoids overlapping refreshes for the same source
- allows global throttle rules without process-local state only

### 5) Geocode cache

The pipeline already spends budget on exact-location geocoding for selected sources. Redis can store resolved coordinates.

- key shape:
  - `crawler:geo:<normalized_address>`
- value:
  - `lat`, `lon`, source, resolved_at

Why it helps:
- repeated exact-location rows avoid re-geocoding
- large revisit/refresh runs become cheaper and faster

### 6) Change-detection cache

Before re-enriching a detail page, cache a fingerprint of the meaningful detail block.

- key shape:
  - `crawler:fingerprint:<source_slug>:<original_url>`
- value:
  - normalized hash of benefit/mission/address/recruit/date block

Why it helps:
- if the detail fingerprint did not change, skip expensive downstream work
- snapshot noise can be reduced

## Practical rollout order

1. **HTML response cache**
2. **source lock + rate token**
3. **detail-page queue**
4. **geocode cache**
5. **detail fingerprint cache**

## Minimal MVP design if Redis is introduced later

- one Redis instance
- one `job_id` per source refresh
- short-TTL listing/detail cache
- one queue for detail enrichment
- one lock key per source

This gives the biggest speedup without forcing a full crawler rewrite.
