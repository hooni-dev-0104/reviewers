import { notFound } from 'next/navigation';

import {
  formatCampaignType,
  formatDeadline,
  getInternalMapLaunchUrl,
  supportsExactMap,
  formatPlatform,
  formatRegion,
  formatSourceName,
  formatText,
  getConfidence,
  getDeadlineState
} from '@/lib/format';
import { getCampaignById, getCampaignCount, getRelatedCampaigns, getVisitorCounts } from '@/lib/supabase';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { Badge, ButtonLink, Surface } from '@/components/ui-kit';
import { SavedCampaignButton } from '@/components/saved-campaign-button';
import { ReminderManager } from '@/components/reminder-manager';

export const dynamic = 'force-dynamic';

export default async function CampaignDetailPage({ params }) {
  const { id } = await params;
  const [campaign, counts, campaignCount] = await Promise.all([
    getCampaignById(id),
    getVisitorCounts(),
    getCampaignCount()
  ]);

  if (!campaign) {
    notFound();
  }

  const displayTitle = formatText(campaign.title);
  const confidence = getConfidence(campaign);
  const deadlineState = getDeadlineState(campaign.apply_deadline);
  const kakaoMapUrl = getInternalMapLaunchUrl(campaign, 'kakao');
  const relatedCampaigns = await getRelatedCampaigns(campaign);
  const detailImage = getDetailImageSrc(campaign.thumbnail_url);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <div className="flex justify-start">
        <ButtonLink href="/" variant="secondary" size="sm">목록으로 돌아가기</ButtonLink>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Surface className="space-y-6 p-5 sm:p-8">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100">
            {detailImage ? (
              <img src={detailImage} alt="" className="aspect-[1.5/1] w-full object-cover" />
            ) : (
              <div className="flex aspect-[1.5/1] items-end bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 p-6 text-white">
                <span className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm font-medium">{formatPlatform(campaign.platform_type)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>{formatSourceName(campaign.sources)}</Badge>
            <Badge tone={getConfidenceTone(confidence.tone)}>{confidence.label}</Badge>
            <Badge tone={getDeadlineTone(deadlineState.tone)}>{deadlineState.label}</Badge>
          </div>

          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">Campaign detail</span>
            <h1 className="text-[32px] font-semibold tracking-[-0.05em] text-slate-950 sm:text-[44px] sm:leading-[1.02]">{displayTitle}</h1>
            <p className="text-sm leading-7 text-slate-600 sm:text-base">{campaign.snippet || '혜택, 마감, 방문 조건을 먼저 보고 원문에서 세부를 확인하세요.'}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>{formatPlatform(campaign.platform_type)}</Badge>
            <Badge>{formatCampaignType(campaign.campaign_type)}</Badge>
            <Badge>{formatRegion(campaign)}</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="혜택" value={campaign.benefit_text || '미공개'} className="sm:col-span-3" />
            <MetricCard label="마감일" value={formatDeadline(campaign.apply_deadline)} hint={deadlineState.label} />
            <MetricCard label="모집 인원" value={campaign.recruit_count ? `${campaign.recruit_count}명` : '미공개'} />
            <MetricCard label="지역" value={formatRegion(campaign)} />
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface className="space-y-5 p-5 sm:p-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Primary CTA</span>
              <h2 className="text-[24px] font-semibold tracking-[-0.04em] text-slate-950">다음 행동을 바로 선택하세요</h2>
              <p className="text-sm leading-6 text-slate-600">상세 보기만 남기지 않고 저장, 원문 이동, 지도 확인, 리마인드를 분리해 행동 우선순위를 더 분명하게 만들었습니다.</p>
            </div>
            <div className="flex flex-col gap-3">
              <a href={campaign.original_url} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center rounded-full border border-indigo-600 bg-indigo-600 px-5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-indigo-500">
                원문 보기
              </a>
              <SavedCampaignButton campaignId={campaign.id} />
              {supportsExactMap(campaign) && campaign.exact_location && kakaoMapUrl ? (
                <a href={kakaoMapUrl} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50">
                  카카오맵 열기
                </a>
              ) : null}
            </div>
          </Surface>

          <ReminderManager campaignId={campaign.id} />

          <Surface className="space-y-4 p-5 sm:p-6">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">상세 정보</span>
            <div className="grid gap-3 text-sm leading-6 text-slate-600">
              <p><strong className="text-slate-950">출처</strong> · {formatSourceName(campaign.sources)}</p>
              <p><strong className="text-slate-950">유형</strong> · {formatCampaignType(campaign.campaign_type)}</p>
              <p><strong className="text-slate-950">지역</strong> · {formatRegion(campaign)}</p>
              <p className="break-all"><strong className="text-slate-950">원문 링크</strong> · {campaign.original_url}</p>
            </div>
          </Surface>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Surface className="space-y-4 p-6 sm:p-8">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">읽는 팁</span>
            <h2 className="text-[24px] font-semibold tracking-[-0.04em] text-slate-950">핵심 정보를 우선 확인하는 읽기 흐름</h2>
          </div>
          <ul className="space-y-3 text-sm leading-7 text-slate-600">
            <li>• 정보가 비어 있으면 원문에서 한 번 더 살펴보세요.</li>
            <li>• 지역 정보가 없으면 방문 가능 여부를 원문에서 확인하세요.</li>
            <li>• 지원은 언제나 외부 원문 페이지에서 진행돼요.</li>
          </ul>
        </Surface>

        <Surface className="space-y-4 p-6 sm:p-8">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">체크리스트</span>
            <h2 className="text-[24px] font-semibold tracking-[-0.04em] text-slate-950">지원 전에 빠르게 점검하세요</h2>
          </div>
          <div className="grid gap-3">
            <MetricCard label="혜택" value="제공 범위가 충분한지 확인" hint="조건이 흐리면 원문 재확인" />
            <MetricCard label="마감" value="오늘·내일 마감인지 확인" hint="임박했다면 바로 원문 이동" />
            <MetricCard label="방문 조건" value="지역과 예약 조건 확인" hint="위치 정보가 비어 있으면 원문 확인" />
          </div>
        </Surface>
      </section>

      <Surface className="space-y-6 p-5 sm:p-8">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">Related campaigns</span>
          <h2 className="text-[24px] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[32px]">같이 볼 만한 캠페인</h2>
        </div>
        {relatedCampaigns.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {relatedCampaigns.map((item) => (
              <Surface key={item.id} className="space-y-4 p-5">
                <div className="space-y-3">
                  <Badge>{formatSourceName(item.sources)}</Badge>
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">{formatText(item.title)}</h3>
                  <p className="text-sm leading-6 text-slate-600">{formatRegion(item)} · {formatDeadline(item.apply_deadline)}</p>
                </div>
                <ButtonLink href={`/campaign/${item.id}`} variant="secondary" size="sm" className="w-full">상세 보기</ButtonLink>
              </Surface>
            ))}
          </div>
        ) : (
          <Surface className="p-6 text-center sm:p-8">
            <p className="text-sm leading-6 text-slate-600">비슷한 캠페인이 아직 없어요. 새로 들어오면 바로 보여드릴게요.</p>
          </Surface>
        )}
      </Surface>
    </SiteShell>
  );
}

function MetricCard({ label, value, hint, className = '' }) {
  return (
    <div className={`rounded-[24px] border border-slate-200 bg-slate-50 p-4 ${className}`.trim()}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <strong className="mt-2 block text-base font-semibold leading-6 tracking-[-0.03em] text-slate-950">{value}</strong>
      {hint ? <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

function getDetailImageSrc(value) {
  if (!value) {
    return null;
  }

  if (value.includes('dq-files.gcdn.ntruss.com')) {
    return `/api/image?src=${encodeURIComponent(value)}`;
  }

  return value;
}

function getConfidenceTone(tone) {
  const tones = {
    ok: 'success',
    warn: 'warn'
  };

  return tones[tone] || 'default';
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
