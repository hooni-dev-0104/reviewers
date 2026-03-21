# Public Source Quality Report

- generated_at: 2026-03-21T05:34:03.391427Z
- mode: daily-refresh
- dry_run: True
- delete_before_refresh: False

## Totals

- fetched: 2564
- normalized: 2564
- failed: 0
- deleted: 0

## Source Results

| source | fetched | normalized | failed | deleted | sample title | notes |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 4blog | 964 | 964 | 0 | 0 | 박가네 | - |
| dinnerqueen | 600 | 600 | 0 | 0 | [랜덤픽] 뉴발란스 MR530KA | requires_review |
| reviewnote | 1000 | 1000 | 0 | 0 | 미닉스 더 플렌더 PRO 음식물 처리기 | - |

## Applicant-facing Field Coverage

| source | total | title | url | platform | type | region | benefit | deadline | slots | mission/summary |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 4blog | 964 | 100% | 100% | 100% | 100% | 16% | 100% | 100% | 100% | 100% |
| dinnerqueen | 600 | 100% | 100% | 100% | 100% | 100% | 89% | 1% | 100% | 89% |
| reviewnote | 1000 | 100% | 100% | 100% | 100% | 95% | 100% | 100% | 100% | 100% |

## Applicant-first Interpretation

- `title`, `url`, `platform`, `type`, `region`, `benefit`, `deadline`, `slots`, and `mission/summary` are the fields most useful to a campaign applicant deciding whether to apply.
- High-volume collection is less valuable than high coverage on those applicant-facing fields.
- Sources with low `deadline` or `region` coverage may still be usable, but usually need `requires_review` or extra parser hardening.

## Interpretation

- `fetched` is the number of source rows collected before normalization.
- `normalized` is the number of rows converted into canonical payloads.
- `failed` counts rows rejected by parser/normalization logic.
- `deleted` reflects source-level refresh deletion when enabled.

## Current Public Parser Set

- 4blog
- dinnerqueen
- reviewnote
