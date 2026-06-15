import { Badge, ButtonLink } from '@/components/ui';

export function SponsorSlot({ sponsor }) {
  const title = sponsor?.title || '제휴 안내';
  const body = sponsor?.body || '리뷰콕 안에서 따로 구분되어 노출되는 제휴 안내 영역이에요.';
  const ctaLabel = sponsor?.cta_label || '자세히 보기';
  const ctaUrl = sponsor?.cta_url;

  return (
    <aside className="sponsor-slot" aria-label="제휴 안내">
      <Badge tone="sponsor" showIcon>제휴</Badge>
      <strong>{title}</strong>
      <p>{body}</p>
      <span>일반 캠페인과 구분해서 보여드려요.</span>
      {ctaUrl ? (
        <ButtonLink href={ctaUrl} target="_blank" rel="noreferrer" variant="secondary" size="sm">
          {ctaLabel}
        </ButtonLink>
      ) : (
        <span>{ctaLabel}</span>
      )}
    </aside>
  );
}
