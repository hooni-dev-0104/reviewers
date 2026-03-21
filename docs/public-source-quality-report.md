# Public Source Quality Report

- generated_at: 2026-03-21T06:31:11.640580Z
- mode: daily-refresh
- report_mode: True
- dry_run: True
- delete_before_refresh: False

## Totals

- fetched: 242
- normalized: 242
- failed: 0
- deleted: 0

## Source Results

| source | fetched | normalized | failed | deleted | sample title | notes |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 4blog | 60 | 60 | 0 | 0 | 진주손칼국수 본점 | - |
| dinnerqueen | 12 | 12 | 0 | 0 | [랜덤픽] 뉴발란스 MR530KA | requires_review |
| reviewnote | 100 | 100 | 0 | 0 | 미닉스 더 플렌더 PRO 음식물 처리기 | - |
| revu | 70 | 70 | 0 | 0 | [부산] 온복국수 부산하단역점 | requires_review |

## Applicant-facing Field Coverage

| source | total | title | url | platform | type | region | benefit | deadline | slots | mission/summary |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 4blog | 60 | 100% | 100% | 100% | 100% | 13% | 100% | 100% | 100% | 100% |
| dinnerqueen | 12 | 100% | 100% | 100% | 100% | 100% | 42% | 33% | 100% | 42% |
| reviewnote | 100 | 100% | 100% | 100% | 100% | 96% | 100% | 100% | 100% | 100% |
| revu | 70 | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |

## Applicant-first Interpretation

- `title`, `url`, `platform`, `type`, `region`, `benefit`, `deadline`, `slots`, and `mission/summary` are the fields most useful to a campaign applicant deciding whether to apply.
- `report_mode=true` means the report used fast sampling limits rather than the full collection depth.
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
- revu (auth-required)
