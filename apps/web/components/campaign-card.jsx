import Link from 'next/link';

import {
  formatCampaignType,
  formatDeadline,
  formatPlatform,
  formatRegion,
  formatSourceName,
  formatSourceTone,
  formatText,
  getDeadlineState
} from '@/lib/format';
import { MapLaunchMenu } from '@/components/map-launch-menu';
import { SavedCampaignButton } from '@/components/saved-campaign-button';
import { Badge, ButtonLink, Surface } from '@/components/ui-kit';
import { cn, cardDescriptionClass, cardTitleClass } from '@/lib/ui';

export function CampaignCard({ campaign }) {
  const deadlineState = getDeadlineState(campaign.apply_deadline);
  const sourceSlug = campaign.sources?.slug || 'unknown';
  const title = formatText(campaign.title);
  const summary = pickSummary(campaign);
  const reward = campaign.benefit_text || '혜택 미공개';
  const deadline = formatDeadline(campaign.apply_deadline);
  const slots = campaign.recruit_count ? `${campaign.recruit_count}명` : '인원 미공개';
  const thumbnailSrc = getThumbnailSrc(campaign.thumbnail_url);

  return (
    <Surface className="group flex h-full flex-col gap-5 p-5 sm:p-6">
      <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
        <Link
          href={`/campaign/${campaign.id}`}
          className="relative block aspect-[1.25/1] overflow-hidden"
          aria-label={`${title} 상세 보기`}
        >
          {thumbnailSrc ? (
            <img
              src={thumbnailSrc}
              alt=""
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className={cn('flex h-full items-end bg-gradient-to-br p-5', getSourceBackground(sourceSlug))} aria-hidden="true">
              <span className="inline-flex rounded-full border border-white/60 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600">
                {formatPlatform(campaign.platform_type)}
              </span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/40 to-transparent" aria-hidden="true" />
        </Link>

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <Badge tone={getSourceBadgeTone(sourceSlug)}>{formatSourceName(campaign.sources)}</Badge>
          <MapLaunchMenu campaign={campaign} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/90 text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white" />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 p-4">
          <Badge tone={getDeadlineTone(deadlineState.tone)}>{deadlineState.label}</Badge>
          <Badge>{formatRegion(campaign)}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <Badge>{formatPlatform(campaign.platform_type)}</Badge>
          <Badge>{formatCampaignType(campaign.campaign_type)}</Badge>
        </div>

        <Link href={`/campaign/${campaign.id}`} className="space-y-3">
          <h3 className={cn(cardTitleClass, 'line-clamp-2')}>{title}</h3>
          <p className={cn(cardDescriptionClass, 'line-clamp-3')}>{summary}</p>
        </Link>

        <div className="grid gap-3 sm:grid-cols-2">
          <MetricCard label="혜택" value={reward} className="sm:col-span-2" />
          <MetricCard label="모집 마감" value={deadline} hint={deadlineState.label} />
          <MetricCard label="모집 인원" value={slots} />
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3 sm:flex-row">
        <SavedCampaignButton campaignId={campaign.id} />
        <ButtonLink href={`/campaign/${campaign.id}`} variant="primary" size="md" className="flex-1">
          상세 보기
        </ButtonLink>
      </div>
    </Surface>
  );
}

function MetricCard({ label, value, hint, className }) {
  return (
    <div className={cn('rounded-[24px] border border-slate-200 bg-slate-50 p-4', className)}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <strong className="mt-2 block text-base font-semibold leading-6 tracking-[-0.03em] text-slate-950">{value}</strong>
      {hint ? <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

function pickSummary(campaign) {
  const title = formatText(campaign.title);
  const snippet = formatText(campaign.snippet);
  const prioritySummary = '혜택, 마감, 지역부터 먼저 확인해보세요.';

  if (!snippet) {
    return prioritySummary;
  }

  if (snippet === title || snippet.replaceAll(' ', '') === title.replaceAll(' ', '')) {
    return prioritySummary;
  }

  return snippet;
}

function getThumbnailSrc(value) {
  if (!value) {
    return null;
  }

  if (value.includes('dq-files.gcdn.ntruss.com')) {
    return `/api/image?src=${encodeURIComponent(value)}`;
  }

  return value;
}

function getSourceBadgeTone(slug) {
  const tones = {
    violet: 'brand',
    blue: 'info',
    emerald: 'success',
    rose: 'danger',
    amber: 'warn'
  };

  return tones[formatSourceTone(slug)] || 'default';
}

function getSourceBackground(slug) {
  const tone = formatSourceTone(slug);
  const styles = {
    violet: 'from-indigo-500 via-violet-500 to-cyan-400',
    blue: 'from-sky-500 via-cyan-500 to-indigo-400',
    emerald: 'from-emerald-500 via-teal-500 to-cyan-400',
    rose: 'from-rose-500 via-orange-400 to-amber-300',
    amber: 'from-amber-400 via-orange-400 to-yellow-300'
  };

  return styles[tone] || 'from-slate-700 via-slate-600 to-slate-500';
}

function getDeadlineTone(tone) {
  const tones = {
    danger: 'danger',
    warn: 'warn',
    accent: 'brand',
    ok: 'success'
  };

  return tones[tone] || 'default';
}
