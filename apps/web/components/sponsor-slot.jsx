export function SponsorSlot({ sponsor }) {
  const title = sponsor?.title || '브랜드 협업 영역';
  const body = sponsor?.body || '추후 광고/제휴 캠페인이 들어오면 이 영역에 applicant-first 기준을 해치지 않는 방식으로 노출돼요.';
  const ctaLabel = sponsor?.cta_label || '문의 준비 중';
  const ctaUrl = sponsor?.cta_url;

  return (
    <aside className="sponsor-slot" aria-label="sponsored">
      <div className="sponsor-badge">Sponsored</div>
      <strong>{title}</strong>
      <p>{body}</p>
      <span>지금은 메인 탐색 흐름을 깨지 않는 자리만 확보해둔 상태예요.</span>
      {ctaUrl ? <a href={ctaUrl} target="_blank" rel="noreferrer">{ctaLabel}</a> : <span>{ctaLabel}</span>}
    </aside>
  );
}
