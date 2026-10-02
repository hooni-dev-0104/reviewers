# 검증 기록 (2026-10-02)

대상: hooni-dev-0104/reviewers, 브랜치 feat/reviewkok-free-sponsored-experience. 기준 12cde6c, 날짜/지역 첫 커밋 d9020ad. 무료/광고 기반 방향 유지. 실제 사용자·광고·매출을 생성하지 않았다.

| 검사 | 결과 | 근거/한계 |
|---|---|---|
| Python unittest | passed | 74개. 기존 69개 중 2개 연도 실패 해소, 5개 날짜 회귀 추가. fixture KST 시계 고정. |
| Web node:test | passed | 14개. 기존 5개 + KST, 지역 쿼리/목록·카운트 일치, 슬롯·URL·기간, 이벤트 API/크기/빈도/DNT/GPC, SEO·CTR 검증. |
| Next production build | passed | Next 16.2.9 / Node 24.19.0. 고정 lockfile npm ci, 변경 없음. |
| SQL isolated PGlite | passed | anon/authenticated read/write/RPC 거부, service RPC, 50회 증가, ID·기간 검사, KST 날짜, 보고서와 보관 삭제. |
| PostgreSQL 다중 세션/PostgREST | blocked | Docker Hub 익명 pull 한도. PGlite의 단일 엔진 제출은 실제 동시 경합 대체 아님. |
| Supabase migration 생성 | blocked | npm CLI postinstall 실패. 검토 SQL만 작성, DB 변경 없음. |
| lint/typecheck | not-run | 저장소 별도 scripts 없음. |
| CI 원격 결과 | not-run | feature push 후 부모가 신규 verify workflow 결과 확인 필요. gh API Forbidden 재시도 안 함. |
| 생산 데이터/운영 배포 | not-run | 부모 조율 전 main push, 운영 DB, 광고 활성화 없음. |

브라우저는 환경에 설치된 Chromium과 agent-browser 0.38.2를 사용했다. Chrome 다운로드는 proxy tunnel 오류로 실패하여 다운로드를 재시도하지 않았다. 컨테이너의 기존 Chromium을 사용하며 socket 경로를 /tmp로 지정했다. 초기 SUID sandbox 설정 오류는 컨테이너 실행 옵션으로 해결했다. 검증 후 브라우저를 닫았다.

## 로컬 UI/HTTP

`scripts/qa-fixture-server.mjs`의 합성 30개 공고와 1개 가상 광고만 사용했다. 테스트용 API URL은 loopback이며 운영 Supabase URL/키를 읽지 않았다. 로컬 fixture 문자열은 실제 credential이 아니다.

- passed: 360/390/768/1440px. 모바일 헤더 줄깨짐·카드 overflow를 실제 렌더에서 발견/수정. 최종 360px body 360/card right 344, 390px body 390, 768px body 768, 1440px body 1440. 주요 버튼 44px 이상. 화면 `qa/*.png`.
- passed: 홈/상세/안내 렌더, error overlay 없음. 최종 production 브라우저 console 출력 없음. React 중복 key 경고를 발견하여 filter/feed key를 분리한 뒤 해소.
- passed: 더 보기 HTTP 503에서 오류·재시도 표시, 복구 후 반복 클릭에도 카드 24→30개, 종료 문구 표시.
- passed: 테스트 광고 라벨, 일반 카드 뒤 1개 노출, 가시성 노출 전송. 상세 원문 click은 campaign_outbound_click + entity UUID + campaign-detail 1건 전송. 실제 외부 탐색은 테스트에서 preventDefault하여 외부 시스템에 요청하지 않았다.
- passed: 검색 결과 없음에서 empty 상태와 광고 0개, 필터 페이지 robots noindex, follow.
- passed: 상세 title/canonical, 없는 UUID 경로 HTTP 404, 미인증 /api/ops/events HTTP 401, 비로그인 저장 안내.
- passed: production mode에서 플래그 미지정 시 광고 0개, /api/events POST 204 (수집 비활성).
- passed: 상세 필터에서 Escape로 닫고 열기 버튼으로 포커스 복원.
- passed: robots/sitemap 생성. sitemap은 홈/안내만 포함하는 보수적 정책이다.
- not-run: 실제 로그인 계정 저장·재방문·삭제 통합, 인증 후 관리 보고서 화면, 백그라운드 탭/키보드/보조 클릭 전체 조합, 만료 페이지의 실제 DB 응답. 단위/격리 검사와 별개로 출시 전 확인한다.

로컬 production 390px 내비게이션의 한 표본: response 292ms, DOMContentLoaded 558ms, load 610ms. localhost 합성 데이터/CPU 및 네트워크 제한 없는 측정이며 Lighthouse 점수, 실제 모바일 성능 또는 개선률이 아니다. dev 스크린샷 일부에는 Next 개발 표시가 있다.

## 남은 출시 검토

#1 기존 UTC 자정 저장값의 원문 날짜 정밀도 검토/승인된 보정, #5 정식 migration·보관 작업·다중 세션 검증, #6 인증된 운영 화면 검증, #7 계정 저장 통합 검증, #8 소스별 수집 허용 근거/운영 연락·개인정보 보관 정책 확정이 남아 있다. 모든 이슈를 완료로 닫지 않는다. 광고/측정은 별도 승인 전 비활성 유지.
