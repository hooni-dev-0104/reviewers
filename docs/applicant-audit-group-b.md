<!-- markdownlint-disable MD013 -->

# Applicant Field Audit — Group B

Scope: `dinnerqueen` + `revu`

## Evidence used

- Checked-in quality report: `docs/public-source-quality-report.md:21-32`
- Parser code: `crawler/sources/seeded.py:66-76`, `crawler/sources/seeded.py:404-455`, `crawler/sources/seeded.py:653-775`
- Parser tests: `tests/test_pipeline.py:107-131`, `tests/test_pipeline.py:190-214`
- Fresh local verification on 2026-03-21:
  - `python3 -m crawler.cli run-report --source dinnerqueen` → matched checked-in dinnerqueen totals/coverage
  - `python3 -m crawler.cli run-report --source dinnerqueen --source revu` → failed for `revu` because local auth env was not configured (`REVU_ACCESS_TOKEN` or `REVU_USERNAME`/`REVU_PASSWORD` missing)

## dinnerqueen

Overall read: usable for title/url/platform/type/region/recruit count, but still weak for benefit, deadline, and applicant summary quality. The checked-in report marks it `requires_review` and shows only 42% benefit coverage, 33% deadline coverage, and 42% mission/summary coverage.

| field | assessment | evidence |
| --- | --- | --- |
| title | Strong | 100% coverage in the report. Listing title overrides detail-page title in `DinnerQueenSourceAdapter.fetch`, so sampled rows keep a usable applicant-facing name. |
| url | Strong | 100% coverage in the report. URL is deterministically built from `campaign_id` (`crawler/sources/seeded.py:701-702`). |
| platform | Usable, slightly brittle | 100% coverage in the report, but platform is inferred from a small token map (`클립`, `릴스`, `인스타`, `유튜브`) and otherwise falls back to `blog` (`crawler/sources/seeded.py:71-76`, `668`). |
| type | Usable, slightly brittle | 100% coverage in the report. Type comes from `ct` plus a listing badge override (`배달`/`방문`) rather than a richer source-of-truth model (`crawler/sources/seeded.py:66-69`, `666-668`, `767-772`). |
| region | Strong | 100% coverage in the report. Region comes from `area1`/`area2` extraction and normalizes `전체` to null secondary region (`crawler/sources/seeded.py:670-676`). |
| benefit | Weak | Only 42% coverage in the report (`docs/public-source-quality-report.md:30`). Fresh local rerun also found 5/12 rows with `benefit_text`. Extraction depends on the detail page containing `제공내역` plus a `color-title` paragraph (`crawler/sources/seeded.py:659-664`). |
| deadline | Weak | Only 33% coverage in the report (`docs/public-source-quality-report.md:30`). Fresh local rerun found 4/12 rows with `apply_deadline`. The parser only accepts `기간:` followed by `YY.MM.DD – YY.MM.DD` or `~` (`crawler/sources/seeded.py:678-690`). |
| recruit count | Strong | 100% coverage in the report. Count is read from the listing card and merged after detail parsing (`crawler/sources/seeded.py:731-756`, `773`). |
| summary usefulness | Medium-low | `snippet` is just `benefit_text` (`crawler/sources/seeded.py:714`), so summary disappears whenever benefit parsing fails and becomes a long/truncated perk block when it succeeds. Normalization trims to 220 chars (`crawler/normalization.py:57-63`). |

### dinnerqueen parser gaps

- Benefit and summary extraction are the same brittle regex path, so both fields fail together on many current cards.
- Deadline extraction is too format-specific; cards without the exact `기간:` + `YY.MM.DD` range pattern lose both `published_at` and `apply_deadline`.
- Platform/type inference relies on a narrow badge/token vocabulary; new DinnerQueen badges can silently degrade to defaults.
- The summary is not a distinct mission summary; it is just the benefit block reused for `snippet`.

## revu

Overall read: the checked-in report says applicant-facing field coverage is complete, but the source still merits review because the parser is heuristic-heavy and local end-to-end reruns are auth-gated.

| field | assessment | evidence |
| --- | --- | --- |
| title | Strong | 100% coverage in the checked-in report (`docs/public-source-quality-report.md:32`). Parser uses `title` or `item` (`crawler/sources/seeded.py:437-443`). |
| url | Strong | 100% coverage in the checked-in report. URL is deterministically built from the campaign id (`crawler/sources/seeded.py:443`). |
| platform | Strong, with mapping risk | 100% coverage in the checked-in report. Media is normalized through `REVU_MEDIA_MAP` (`crawler/sources/seeded.py:98-103`, `444`). |
| type | Strong, with taxonomy risk | 100% coverage in the checked-in report. Type is inferred from category labels via `_infer_revu_campaign_type` (`crawler/sources/seeded.py:394-402`, `445`). |
| region | Strong | 100% coverage in the checked-in report. Region is taken from `venue.addressFirst`, with `localTag` as fallback (`crawler/sources/seeded.py:409-425`). The unit test covers the current happy path (`tests/test_pipeline.py:190-214`). |
| benefit | Strong | 100% coverage in the checked-in report. Benefit is assembled from `campaignData.reward`, `point`, and `label` (`crawler/sources/seeded.py:427-435`, `450`). |
| deadline | Strong | 100% coverage in the checked-in report. Deadline is copied directly from `requestEndedOn` (`crawler/sources/seeded.py:452`). |
| recruit count | Strong | 100% coverage in the checked-in report. Count is copied directly from `reviewerLimit` (`crawler/sources/seeded.py:451`). |
| summary usefulness | Medium (inference) | Coverage is 100%, but `snippet` is `item` or `benefit_text` (`crawler/sources/seeded.py:455`). In the unit-test fixture, `snippet` equals the title exactly, so applicants may get little extra decision-making context beyond the headline. |

### revu parser gaps

- Local end-to-end verification is blocked without REVU auth, so current live payload quality cannot be rechecked from this worker environment.
- Campaign type depends on only three known labels (`배송형`, `구매형`, `방문형`); new taxonomy values fall to `etc`.
- Region parsing only keeps the first two address tokens or first local tag, which can be too coarse for complex venue/location strings.
- Benefit parsing captures reward/points/label but not a fuller mission/requirement summary, so summary quality is better than DinnerQueen on coverage but still not necessarily applicant-optimal.

## Bottom line

- `dinnerqueen`: acceptable for routing applicants into a campaign list, but still weak for benefit/deadline/summary decisions and should remain `requires_review`.
- `revu`: structurally much stronger on field fill-rate, but still deserves parser hardening around taxonomy drift, region granularity, and richer mission-summary capture; local live verification remains auth-dependent.
