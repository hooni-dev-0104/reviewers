# Applicant Audit Group A

_Date: 2026-03-21_

Scope: active-source applicant-field audit for `4blog` and `reviewnote`.

## Evidence used

- Repository quality report snapshot: `docs/public-source-quality-report.md` (generated 2026-03-21; `4blog` rows at 20/29 and `reviewnote` rows at 22/31).
- Fresh CLI report check on 2026-03-21 10:57 UTC: `python3 -m crawler.cli run-report --source 4blog --source reviewnote`.
- Current parser implementation: `crawler/sources/seeded.py` (`4blog` at 110-160 and 462-538; `reviewnote` at 175-314).
- Parser regression tests: `tests/test_pipeline.py` (`4blog` at 74-105; `reviewnote` at 133-188).
- Live dry-run spot checks on 2026-03-21 with `run_source_pipeline(..., report_mode=True)` for duplicate, status, and field-coverage sampling.

## 1. 4blog (`포블로그`)

### Snapshot

- Repository report sample size: 60 campaigns.
- Applicant-field coverage from the shipped report: title 100%, url 100%, platform 100%, type 100%, region 13%, benefit 100%, deadline 100%, slots 100%, mission/summary 100%.
- Fresh CLI report on 2026-03-21 10:57 UTC matched the same 60/60/0 profile.
- Platform mix from the live dry-run: 49 blog, 10 instagram, 1 youtube.
- Type mix from the live dry-run: 41 visit, 19 delivery.
- Duplicate check from the live dry-run: **0 duplicate URLs**, **1 duplicate normalized title** (`더온담 (인스타)` appeared twice).

### Applicant-facing field findings

| Field | Audit | Evidence | Applicant impact |
| --- | --- | --- | --- |
| Title | **Mostly strong, but slightly noisy.** The parser strips leading bracket annotations and keeps the core store/product title. | `transform_4blog_item()` cleans `CAMPAIGN_NM` with `_split_4blog_title_annotations()` (`crawler/sources/seeded.py:135-145`, `462-480`). The test expects `[대구/수성구] 테스트 캠페인` to become `테스트 캠페인` (`tests/test_pipeline.py:81-105`). | Good for quick scanning, but a few titles still carry encoded entities, e.g. `&quot;갱생&quot; 퓨전요리주점` in the live dry-run. |
| URL | **Strong.** | Current report shows 100% URL coverage. URLs are built directly from `CID` as `https://4blog.net/campaign/<cid>/` (`crawler/sources/seeded.py:467-481`). Live duplicate check found no duplicate URLs. | Stable deep links are present for applicants, and dedupe quality is currently good at the URL level. |
| Platform | **Strong.** | Current report shows 100% platform coverage. `CATEGORY` is mapped through `FOUR_BLOG_PLATFORM_MAP` (`crawler/sources/seeded.py:25-34`, `465-466`). | Applicants can reliably tell whether a campaign is blog vs Instagram vs YouTube. |
| Type | **Good, with some silent fallback risk.** | Current report shows 100% type coverage. `CATEGORY1` maps to `visit` / `delivery` / `content`, but unknown values fall back to `visit` (`crawler/sources/seeded.py:36-40`, `465`). | Usually usable, but an unseen source value could be mislabeled as `visit` without review. |
| Region | **Weak. Main issue for this source.** | Current report shows just 13% region coverage (8/60). Region only comes from `LOCATION_NM` or bracket tokens that match the hard-coded province list (`crawler/sources/seeded.py:123-160`). Live dry-run missing-region examples included `비타루테인 아레타잔틴`, `어린 왕자`, and `타로 손금 온라인상담`. | Applicants cannot quickly filter by local eligibility or tell whether a listing is remote/product-only in most rows. |
| Benefit | **Strong.** | Current report shows 100% benefit coverage. `benefit_text` comes directly from `REVIEWER_BENEFIT` (`crawler/sources/seeded.py:488`). | Usually the clearest applicant-facing value proposition on this source. |
| Deadline | **Strong, with minor year-rollover risk.** | Current report shows 100% deadline coverage. `_normalize_4blog_date()` converts `MM.DD` into ISO date using the current year and a 6-month rollover heuristic (`crawler/sources/seeded.py:110-120`). | Applicants get a usable deadline, but year inference could be wrong around calendar boundaries if source data spans seasons unexpectedly. |
| Recruit count | **Strong.** | Current report shows 100% slot coverage. `REVIEWER_CNT` is passed through directly (`crawler/sources/seeded.py:489`). | Applicants can judge competitiveness at a glance. |
| Summary usefulness | **Present everywhere, but inconsistent in quality.** | Current report shows 100% mission/summary coverage. The summary is just `REVIEWER_BENEFIT + KEYWORD` (`crawler/sources/seeded.py:475-476`). Live dry-run summaries ranged from concise keyword bundles to extremely long promo blocks; some still include HTML entities such as `&#39;`. | Useful as a quick teaser, but some rows are too long or too noisy to help with apply/skip decisions. |

### Concrete parser gaps

1. **Region extraction is too narrow for 4blog.** If `LOCATION_NM` is blank and the title does not start with a recognized region token, the row stays regionless.
2. **Title and summary cleanup is incomplete.** Live dry-run output still showed encoded entities in both title (`&quot;`) and snippet (`&#39;`).
3. **Type fallback is optimistic.** Unknown `CATEGORY1` values silently become `visit`, which can mislead applicants.
4. **Summary length is uncontrolled.** Long `REVIEWER_BENEFIT` blocks flow straight into `snippet`, so some rows read like raw seller instructions instead of an applicant summary.
5. **Remote/non-location campaigns are not labeled explicitly.** Many delivery/product campaigns end up with blank region rather than a clearer `재택`/remote signal.
6. **Title-level duplicates are possible even when URLs are unique.** Current sample had one repeated normalized title, so applicant-facing grouping should not rely on title alone.

### Applicant-quality verdict

`4blog` is usable today for title, value, deadline, and slot triage, but it is the weakest source in the active set for region clarity. Applicant experience would improve most from better region inference plus summary cleanup.

## 2. reviewnote (`리뷰노트`)

### Snapshot

- Repository report snapshot shows 100 campaigns with 100% deadline and slot coverage.
- Fresh CLI report on **2026-03-21 10:57 UTC** was materially worse: 96 fetched / 96 normalized / 0 failed, `requires_review`, region 95%, **deadline 0%**, and slots 98%.
- Separate live dry-run spot checks earlier the same day hit the API-backed path and returned 100 fetched / 100 normalized / 0 failed with strong deadline coverage.
- This means reviewnote applicant quality is **currently unstable**, not consistently bad: the API path is strong, but fallback mode degrades sharply.
- Platform mix from the stronger API-backed spot check: 86 blog, 14 instagram.
- Type mix from the stronger API-backed spot check: 95 visit, 2 delivery, 1 purchase, 2 content.
- Duplicate check from the live dry-run: **0 duplicate URLs**, **1 duplicate normalized title** (`하베레피부전문센터` appeared twice).

### Applicant-facing field findings

| Field | Audit | Evidence | Applicant impact |
| --- | --- | --- | --- |
| Title | **Strong.** | Repository report shows 100% title coverage, and even the degraded 10:57 UTC CLI report kept 100% title coverage. API normalization keeps a trimmed title (`crawler/sources/seeded.py:295-299`), and fallback HTML parsing removes leading region tokens (`175-188`, `191-248`). Tests cover both API and HTML parsing (`tests/test_pipeline.py:133-188`). | Titles are clean and applicant-readable in both normal and fallback modes. |
| URL | **Strong.** | Repository and fresh CLI reports both show 100% URL coverage. URLs are built directly from the campaign id (`crawler/sources/seeded.py:298`). Live duplicate check found no duplicate URLs. | Stable deep links are available, and URL-level dedupe looks healthy. |
| Platform | **Strong.** | Repository and fresh CLI reports both show 100% platform coverage. API `channel` values map to blog / instagram / youtube (`crawler/sources/seeded.py:252-258`); fallback HTML uses the icon SVG (`231`). | Applicants can reliably identify the required posting channel. |
| Type | **Strong.** | Repository and fresh CLI reports both show 100% type coverage. API `sort` values map to visit / delivery / purchase / content (`260-267`). Fallback HTML also retains full type coverage in the 10:57 UTC report. | Clear and useful for deciding whether the campaign matches the applicant workflow. |
| Region | **Generally good, but remote rows are blank and fallback loses a bit more coverage.** | Repository report shows 96% region coverage; the 10:57 UTC CLI report showed 95%. API parsing sets `region_primary_name = None` when `city == "재택"` (`284-289`). Missing-region rows included `미닉스 더 플렌더 PRO 음식물 처리기` and `파인캐디 UPL2000 mini 에이밍 골프거리측정기`. | Most applicants get clear location context, but remote eligibility is represented as absence rather than a positive remote label. |
| Benefit | **Strong.** | Repository and fresh CLI reports both show 100% benefit coverage. `benefit_text` comes from `offer` in API mode (`305`) or the listing card text in fallback mode (`200`, `237`). | Usually enough to understand the reward immediately. |
| Deadline | **Unstable and high-risk.** | Repository report snapshot showed 100% deadline coverage, but the fresh CLI report at 10:57 UTC showed **0% deadline coverage** because fallback HTML sets `apply_deadline = None` (`239`). API mode keeps `applyEndAt` (`307`). | Applicants may see a fully useful deadline field or no deadline at all, depending on whether the API path is available. |
| Recruit count | **Usually strong, but not perfectly resilient.** | Repository report snapshot showed 100% slot coverage; the fresh CLI report dropped to 98%. API mode uses `infNum` (`306`); fallback HTML depends on parsing listing text (`203-205`, `238`). | Applicants usually get slot counts, but fallback mode can lose a few. |
| Summary usefulness | **Strong.** | Repository and fresh CLI reports both show 100% mission/summary coverage. The snippet combines `offer` with purchase/payback details in API mode (`277-282`, `310`), and tests assert reward text is preserved (`tests/test_pipeline.py:164-188`). | The summary is compact and usually more decision-useful than 4blog because it combines the offer with payment/payback detail. |

### Concrete parser gaps

1. **Deadline quality is unstable because fallback HTML mode loses it entirely.** This is the biggest applicant-facing risk on reviewnote right now.
2. **Remote campaigns are under-explained.** `city == "재택"` becomes a blank region instead of an explicit remote label.
3. **Status normalization is too coarse.** Live API-backed dry-run `raw_status` values were `select` (98) and `progress` (2), but normalized `status` was `active` for all 100 rows (`crawler/sources/seeded.py:311-313`).
4. **Fallback HTML mode is materially weaker than API mode.** In fallback, `apply_deadline` and `published_at` are always `None` and `requires_review` is always `True` (`239-245`).
5. **Published date is not captured even in API mode.** `published_at` is always `None` (`308`), which limits freshness sorting and applicant timeline context.
6. **Unknown API enums collapse to generic buckets.** Unseen `channel` or `sort` values fall back to `blog` / `etc`, so future source-side changes could degrade classification quietly.
7. **Title-level duplicates can exist despite unique URLs.** Current sample had one repeated normalized title, so downstream dedupe should continue to key on URL/source rather than title.

### Applicant-quality verdict

`reviewnote` is strong only while the API-backed path is healthy. As of 2026-03-21, the source shows a real resilience problem: when fallback mode is used, applicant deadline quality collapses.

## Overall recommendation for Group A

1. Prioritize **4blog region and summary cleanup** first; that is the biggest always-visible applicant-quality gap in this group.
2. Prioritize **reviewnote fallback hardening** second, specifically restoring deadline fidelity and slot completeness when the API path is unavailable.
3. Add an explicit **remote/재택 representation** for both sources instead of leaving region blank.
4. Keep dedupe keyed on **source + original_url**, not normalized title.
