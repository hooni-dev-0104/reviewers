import { Badge, Surface } from '@/components/ui-kit';
import { getButtonClasses } from '@/lib/ui';

export function SponsorSlot({ sponsor }) {
  const title = sponsor?.title || '제휴 안내';
  const body = sponsor?.body || '리뷰콕 안에서 따로 구분되어 노출되는 제휴 안내 영역이에요.';
  const ctaLabel = sponsor?.cta_label || '자세히 보기';
  const ctaUrl = sponsor?.cta_url;

  return (
    <Surface as="aside" className="flex h-full flex-col gap-5 overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-white">
      <Badge tone="dark" className="w-fit border-white/10 bg-white/10 text-white">Sponsored</Badge>
      <div className="space-y-3">
        <strong className="block text-[28px] font-semibold tracking-[-0.05em] text-white">{title}</strong>
        <p className="text-sm leading-7 text-slate-200">{body}</p>
      </div>
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
        일반 캠페인 흐름과 섞이지 않도록 분리된 카드 구조로 제휴 메시지를 더 명확하게 전달합니다.
      </div>
      {ctaUrl ? (
        <a href={ctaUrl} target="_blank" rel="noreferrer" className={getButtonClasses({ variant: 'secondary', size: 'md', className: 'border-white/20 bg-white text-slate-950 hover:bg-slate-100' })}>
          {ctaLabel}
        </a>
      ) : (
        <span className="text-sm font-medium text-slate-200">{ctaLabel}</span>
      )}
    </Surface>
  );
}
