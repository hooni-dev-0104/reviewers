'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  formatCampaignType,
  formatDeadline,
  formatPlatform,
  formatRegion,
  formatSourceName,
  getConfidence
} from '@/lib/format';
import { useAppClient } from '@/components/app-client-providers';
import { Badge, ButtonLink, EmptyState, Surface } from '@/components/ui-kit';

export function SavedCampaignsView() {
  const { session, savedIds } = useAppClient();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch('/api/saved')
      .then((response) => response.json())
      .then((payload) => setCampaigns(Array.isArray(payload.items) ? payload.items : []))
      .finally(() => setLoading(false));
  }, [session, savedIds.join(',')]);

  const ordered = useMemo(() => {
    const byId = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
    return savedIds.map((id) => byId.get(id)).filter(Boolean);
  }, [campaigns, savedIds]);

  if (!session) {
    return (
      <EmptyState
        title="저장 목록은 로그인 후 사용할 수 있어요"
        description="계정을 만들면 저장한 캠페인을 브라우저가 바뀌어도 이어서 볼 수 있어요."
        actions={[<ButtonLink key="account" href="/account?next=/saved" variant="primary">로그인하러 가기</ButtonLink>]}
      />
    );
  }

  if (loading) {
    return <EmptyState title="저장한 캠페인을 불러오는 중이에요" />;
  }

  if (!ordered.length) {
    return (
      <EmptyState
        title="아직 저장한 캠페인이 없어요"
        description="마음에 드는 카드에서 저장 버튼을 눌러두면 여기서 다시 비교할 수 있어요."
      />
    );
  }

  return (
    <section className="grid gap-4">
      {ordered.map((campaign) => {
        const confidence = getConfidence(campaign);
        return (
          <Surface key={campaign.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>{formatSourceName(campaign.sources)}</Badge>
                <Badge tone={getConfidenceTone(confidence.tone)}>{confidence.label}</Badge>
                <Badge>{formatPlatform(campaign.platform_type)}</Badge>
                <Badge>{formatCampaignType(campaign.campaign_type)}</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{campaign.title}</h3>
                <p className="text-sm leading-6 text-slate-600">{formatRegion(campaign)} · {formatDeadline(campaign.apply_deadline)}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:min-w-[220px]">
              <ButtonLink href={`/campaign/${campaign.id}`} variant="primary">상세 보기</ButtonLink>
              <a href={campaign.original_url} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50">
                원문 이동
              </a>
            </div>
          </Surface>
        );
      })}
    </section>
  );
}

function getConfidenceTone(tone) {
  const tones = {
    ok: 'success',
    warn: 'warn'
  };

  return tones[tone] || 'default';
}
