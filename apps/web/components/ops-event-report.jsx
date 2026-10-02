import Link from 'next/link';
export function OpsEventReport({ report }) {
  const states = { disabled: '측정 비활성 — 0건을 의미하지 않습니다.', 'migration-required': '집계 DB 준비 필요 — migration 적용 여부를 확인하세요.', error: '보고서 일시 오류 — 실제 0건과 구분합니다.' };
  if (report.state !== 'ready') return <section className="info-panel"><h2>광고·원문 이동 집계</h2><p role="status">{states[report.state] || '인증이 필요합니다.'}</p></section>;
  const { totals } = report;
  return <section className="info-panel">
    <h2>광고·원문 이동 집계</h2>
    <nav aria-label="집계 기간"><Link href="/ops?days=7">최근 7일</Link> · <Link href="/ops?days=30">최근 30일</Link></nav>
    <p>{report.start} ~ {report.end} · KST, 오늘 포함</p>
    <div className="stats-strip"><div><strong>{totals.impressions}</strong><span>적격 광고 노출</span></div><div><strong>{totals.clicks}</strong><span>광고 클릭</span></div><div><strong>{totals.ctr === null ? '—' : `${totals.ctr.toFixed(2)}%`}</strong><span>CTR (클릭÷노출)</span></div><div><strong>{totals.outbound}</strong><span>캠페인 원문 이동</span></div></div>
    <p>이벤트 수입니다. 고유 사용자·지원 완료·구매·매출·정산 검증치가 아닙니다. DNT/GPC, 차단, 전송 실패와 중복 완화로 실제 행동과 차이가 있습니다. 노출은 화면 50% 이상, 활성 탭에서 연속 1초 기준입니다.</p>
    {report.rows.length ? <div className="ops-list">{report.rows.map(row => <div className="ops-row" key={`${row.slot_key}:${row.entity_id}`}><strong>{row.slot_key}</strong><code className="break-anywhere">{row.entity_id}</code><span>노출 {row.impressions || 0} · 클릭 {row.clicks || 0} · 원문 {row.outbound || 0}</span></div>)}</div> : <p>이 기간에 수신된 이벤트가 없습니다.</p>}
    <p>삭제·이름 변경 후에도 동일 ID로 표시하며, 현재 이름을 과거 실적으로 소급하지 않습니다.</p>
  </section>;
}
