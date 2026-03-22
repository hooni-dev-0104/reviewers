export function SponsorSlot({ sponsor }) {
  const title = sponsor?.title || '제휴 안내';
  const body = sponsor?.body || '리뷰어스와 함께 노출되는 제휴 안내 영역이에요.';
  const ctaLabel = sponsor?.cta_label || '자세히 보기';
  const ctaUrl = sponsor?.cta_url;

  return (
    <aside className="sponsor-slot" aria-label="sponsored">
      <div className="sponsor-badge">제휴</div>
      <strong>{title}</strong>
      <p>{body}</p>
      <span>일반 캠페인 흐름과 섞이지 않게 따로 구분해서 보여줘요.</span>
      {ctaUrl ? <a href={ctaUrl} target="_blank" rel="noreferrer">{ctaLabel}</a> : <span>{ctaLabel}</span>}
    </aside>
  );
}
