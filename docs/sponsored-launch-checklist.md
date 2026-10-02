# 무료·광고 기반 출시 검토 (#4–#8)

리뷰콕은 무료 탐색 서비스다. 구독·대행사·결제·외부 광고 SDK·외부 분석 픽셀은 없다. 실제 사용자/매출 0이라는 작업 전제를 유지하며 테스트 화면을 실적으로 사용하지 않는다.

## 배포 범위와 경계

현재 Next.js `apps/web` 및 Python 크롤러를 개선한다. README의 Flutter 주 클라이언트 방향과 공존하며 Flutter 이전 작업을 포함하지 않는다. main의 `apps/web/**` push는 `.github/workflows/vercel-production.yml`에 의해 연결된 Vercel production으로 배포된다. `VERCEL_PROJECT_ID`의 실제 값/운영 도메인은 이 작업에서 조회하지 않았다. 코드 기본 URL은 reviewkok.vercel.app이지만 실제 배포 대상은 부모가 연결 설정과 결과 URL로 확인해야 한다.

사용자는 push/배포를 허용했지만 이 작업은 부모의 출시 조율 전에 main을 push하지 않는다. 별도 운영 DB 변경·광고/측정 활성화는 승인 범위 밖이다.

## 기능 플래그와 슬롯 계약

`SPONSOR_SLOTS_ENABLED=false`, `AD_EVENTS_ENABLED=false`가 기본값이다. 둘은 서버 전용 값이며 클라이언트에는 필요한 boolean만 전달한다. 저장소의 `.env.example`은 비활성 예시다. 기존 비밀값을 조회/복사하거나 신규 운영 비밀값을 만들지 않는다.

허용 슬롯은 `feed-inline` 1개, 6번째 캠페인 바로 뒤에 1회다. 상세 광고 슬롯은 아직 도입하지 않는다. `campaign-detail`은 원문 이동 이벤트 위치 이름이다. 광고는 is_active + start ≤ now < end를 만족해야 하며 양쪽 날짜 필수, 역전·누락·잘못된 URL은 숨긴다. 숫자 priority 오름차순, ID 오름차순으로 동률을 결정한다. 후보를 100개씩 순서대로 조회하여 유효한 첫 광고를 선택한다. 광고 조회 실패는 캠페인을 실패시키지 않는다.

## 광고 집계

세 이벤트만 허용: sponsor_impression, sponsor_click, campaign_outbound_click. 동일 출처 POST, JSON 1KB 제한(스트림 포함), UUID/슬롯 allowlist, DNT/GPC client/server 무시 정책. 클릭 전송은 탐색을 막지 않는다. 노출은 활성 탭, 50% 이상 1초 연속이며 컴포넌트 생명주기당 1회다. 탭 재방문·페이지 새로고침은 새 이벤트일 수 있다. 고유 사용자·지원 완료·매출·정산치가 아니다.

요청 빈도는 프로세스별 1분 60회, 최대 10,000개 transient bucket. IP는 메모리 HMAC 키로만 변환하며 DB/log에 기록하지 않고 1분 TTL을 지닌다. 호출 시 만료 bucket을 제거하므로 유휴 프로세스 메모리에 만료 키가 남을 수 있다. distributed/global rate limit이 아니며 IP 헤더는 배포 프록시가 정규화하는지 확인해야 한다. 실제 광고 활성화 전 남용 정책 검토가 필요하다.

## SQL 제안, 적용 순서, 복구

`docs/sql/ad-events-proposal.sql`은 검토용 SQL이며 migration은 아니다. Supabase CLI 설치 postinstall 실패로 `supabase migration new`를 실행하지 못했다. 실제 데이터베이스에는 적용하지 않았다.

1. [ ] 지원 환경에서 CLI를 설치하고 `supabase migration new ad_events`로 migration을 생성한 뒤 제안 SQL을 옮긴다.
2. [ ] 격리 PostgreSQL에서 전체 기존 schema + migration + PostgREST를 확인한다. 테이블 RLS, anon/authenticated 권한 없음, service_role 전용 security-invoker RPC를 검증한다.
3. [ ] 다중 세션 동시 증가/실제 KST 자정/삭제·변경 엔터티 보고서를 검증한다. PGlite 검증은 다중 세션 경합을 대체하지 않는다.
4. [ ] `purge_ad_events()`를 하루 한 번 실행하는 보관 작업을 별도 승인된 방식으로 설정하고 90일 초과 삭제를 검증한다. 확정 전 집계를 켜지 않는다.
5. [ ] 운영 DB 변경 대상/권한/기능 플래그를 승인받고 적용한다. 사용자 공개 역할에 집계 권한을 주지 않는다.
6. [ ] 광고 계약·표시·원문 검증 후 별도 승인으로 광고 플래그를 켠다. 측정은 보관·정책 확인 후 별도로 켠다.

복구: 두 플래그를 false로 되돌리면 광고/측정이 즉시 안전하게 비활성 동작한다. 미적용 RPC나 DB 오류 시 집계 API는 실패하지만 링크 탐색은 유지된다. 보고서는 disabled/migration-required/error/ready-0건을 구분한다. 배포 rollback은 직전 검증 커밋으로 복원한다. SQL 테이블은 기본적으로 삭제하지 않고 쓰기 중단 후 보관/삭제 정책에 따라 처리한다.

## SEO·저장

상세의 원문 사실로 제목·설명·canonical·OG/Twitter 메타데이터를 만든다. 없는/숨김 캠페인은 404, 만료는 공개 유지 + noindex다. 필터 URL은 noindex 및 홈 canonical. 최초 sitemap은 홈·안내만 포함하고 캠페인은 내부 링크로 발견되도록 한다. 검증되지 않은 대량 캠페인 sitemap 확장은 후속 검토 대상이다. 계정 저장은 만료 항목도 보이며 비공개/삭제 항목은 unavailable로 표시·제거할 수 있다. 신규 알림 발송/자동 구독은 없다.

## 운영자 확인이 필요한 정책

- [ ] reviewnote/reviewplace/revu/dinnerqueen/4blog/seouloppa/ringble/gangnammatzip/chehumview/modan/nolowa 각각의 수집·재게시 허용 근거, 약관/robots 확인 날짜, 제외 요청 경로를 기록한다. 허용을 추정하지 않는다. 로그인/차단 우회를 하지 않는다.
- [ ] 비공개 정정·제외 연락 경로와 사업자 정보를 운영자가 확정한다. 현재 안내는 실제 저장소 이슈 링크만 제공하며 개인정보 게시 금지를 알린다.
- [ ] 기존 rv_vid 방문 쿠키와 서버 방문 데이터 보관·선택권, 광고 집계 90일 보관 및 DNT/GPC 안내의 운영·법적 적합성을 확인한다. 이 문서는 법률 검토 완료를 주장하지 않는다.
- [ ] 기존 timestamptz의 날짜 정밀도는 원문 snapshot으로 확인한다. UTC 자정 데이터를 임의 보정하지 않는다 (`date-region-policy.md`).

## 검증/출시 gate

- [ ] Python/Web 단위 테스트, build가 대상 SHA에서 통과.
- [ ] lint/typecheck는 현재 별도 스크립트 없음; 통과로 기록하지 않는다.
- [ ] 비운영 `verify-without-production` CI 결과를 대상 SHA에서 확인.
- [ ] 360/390/768/1440px, empty/error/retry/end, 광고 없음/적격 노출/클릭, 링크, 키보드/취소/뒤로가기, 로그인 저장·관리 화면을 점검.
- [ ] 실제 로컬 성능 측정과 한계 기록. 배포 후 실사용 성능/전환 개선으로 해석하지 않는다.
- [ ] 부모가 정확한 커밋과 Vercel target 확인 후 main 통합·배포를 조율.
- [ ] 배포된 SHA·CI·실제 URL·날짜/지역/광고 off/측정 off를 확인. 측정 비활성의 0과 실제 수신 0을 구분.

`scheduled-refresh` dispatch는 테스트 뒤 운영 수집을 수행할 수 있으므로 단위 검증 목적으로 사용하지 않는다. `source-counts`는 운영 DB 접근, `source-refresh`는 운영 수집이므로 여기서 실행하지 않는다. 기존 `flutter-ci`는 비운영이나 이번 Next.js/Python 변경의 검증 경로가 아니다. 새 `verify.yml`은 feature push/PR/manual에서 비밀값·운영 DB·배포 없이 검증한다.
