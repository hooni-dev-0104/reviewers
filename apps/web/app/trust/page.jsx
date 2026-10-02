import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
export const metadata = { title: '출처·광고·개인정보 안내 | 리뷰콕', alternates: { canonical: '/trust' } };
export default function TrustPage() {
  const measuring = process.env.AD_EVENTS_ENABLED === 'true';
  return <SiteShell><section className="trust-page">
    <span className="eyebrow">리뷰콕 이용 안내</span><h1>무료로 탐색하고, 원문에서 확인하세요.</h1>
    <p>리뷰콕은 외부 체험단 모집 공고를 비교하기 쉽게 정리합니다. 지원·예약·추가 비용·일정의 최종 확인과 신청은 각 원문 사이트에서 이루어집니다.</p>
    <article className="info-panel"><h2>출처와 정정</h2><p>캠페인에는 출처와 원문 링크를 표시합니다. 수집 이후 모집 조건이 바뀔 수 있고, 지역·일정이 불명확하면 확인이 필요한 정보로 표시합니다. 수집 시각은 원문 내용의 정확성을 보증하는 시각이 아닙니다.</p><p>현재 확인 가능한 공개 정정 요청 경로는 <a href="https://github.com/hooni-dev-0104/reviewers/issues" target="_blank" rel="noopener noreferrer">저장소 이슈 ↗</a>입니다. 공개 글에는 개인정보를 적지 마세요. 비공개 문의 경로는 운영자 확인 전까지 제공하지 않습니다.</p></article>
    <article className="info-panel"><h2>무료 서비스와 광고</h2><p>캠페인 탐색은 무료입니다. 유료 광고·제휴는 ‘광고’로 표시하며 일반 캠페인 검색 순위를 바꾸지 않습니다. 광고가 없으면 해당 영역을 표시하지 않습니다. 구독이나 유료 회원제는 제공하지 않습니다.</p></article>
    <article className="info-panel"><h2>방문 쿠키와 광고 집계는 다릅니다</h2><p>기존 방문 기능은 rv_vid 쿠키(최대 1년)와 날짜·방문 경로를 이용해 일별 방문을 기록합니다. 쿠키를 삭제하거나 차단할 수 있습니다. 서버 방문 기록의 보관·삭제 일정은 운영자가 확정해야 합니다.</p><p>광고 집계는 현재 <strong>{measuring ? '활성' : '비활성'}</strong>입니다. 활성화 시 KST 날짜·이벤트 종류·캠페인 또는 광고 ID·슬롯별 횟수만 집계합니다. 광고 집계 테이블에 IP·계정·쿠키 ID·이메일·상세 referrer나 방문 URL을 저장하지 않습니다.</p><p>광고 노출은 활성 탭에서 영역의 50% 이상이 연속 1초 보일 때 측정합니다. 광고 클릭과 상세의 원문 이동도 별도로 셉니다. 브라우저 DNT/GPC가 켜져 있으면 광고 집계를 보내거나 기록하지 않습니다. 남용 방지용 IP 해시는 서버 메모리에서 1분 단위로 만료 처리하며 DB에 저장하지 않습니다.</p><p>집계 보관 목표는 90일이며 삭제 작업 검증이 활성화의 선행 조건입니다. 집계는 고유 사용자·신청 완료·구매·매출을 나타내지 않습니다. 브라우저 차단과 전송 실패로 누락될 수 있습니다.</p></article>
    <article className="info-panel"><h2>저장과 리마인드</h2><p>웹의 저장 목록은 로그인한 계정에 연결됩니다. 모집 종료나 삭제된 항목은 다시 확인이 필요합니다. 리마인드는 다시 볼 시점의 저장 기능이며 현재 이메일·푸시 알림을 발송하지 않습니다.</p><Link href="/saved">저장 목록 보기</Link></article>
    <Link href="/" className="primary-action">캠페인 탐색으로 돌아가기</Link>
  </section></SiteShell>;
}
