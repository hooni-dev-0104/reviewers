'use client';

import Link from 'next/link';
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
import { Badge, ButtonLink, EmptyState, Skeleton, Tag } from '@/components/ui';

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
        icon="bookmark"
        title="저장 목록은 로그인 후 사용할 수 있어요"
        body="계정을 만들면 저장한 캠페인을 브라우저가 바뀌어도 이어서 볼 수 있어요."
        action={<ButtonLink href="/account?next=/saved" variant="quiet" size="sm">로그인하기</ButtonLink>}
      />
    );
  }

  if (loading) {
    return (
      <section className="saved-list" aria-label="저장 목록 로딩 중">
        <Skeleton style={{ height: 92 }} />
        <Skeleton style={{ height: 92 }} />
        <Skeleton style={{ height: 92 }} />
      </section>
    );
  }

  if (!ordered.length) {
    return (
      <EmptyState
        icon="bookmark"
        title="아직 저장한 캠페인이 없어요"
        body="마음에 드는 카드에서 저장 버튼을 눌러두면 여기서 다시 볼 수 있어요."
        action={<ButtonLink href="/#explore" variant="quiet" size="sm">캠페인 둘러보기</ButtonLink>}
      />
    );
  }

  return (
    <section className="saved-list">
      {ordered.map((campaign) => {
        const confidence = getConfidence(campaign);
        return (
          <article key={campaign.id} className="saved-row">
            <div>
              <div className="card-meta-row compact-row">
                <span className="source-chip">{formatSourceName(campaign.sources)}</span>
                <Badge tone={confidence.tone} showIcon>{confidence.label}</Badge>
              </div>
              <h3>{campaign.title}</h3>
              <div className="chip-row compact-row">
                <Tag>{formatPlatform(campaign.platform_type)}</Tag>
                <Tag>{formatCampaignType(campaign.campaign_type)}</Tag>
                <Tag>{formatRegion(campaign)}</Tag>
                <Tag icon="clock">{formatDeadline(campaign.apply_deadline)}</Tag>
              </div>
            </div>
            <div className="saved-actions">
              <ButtonLink href={`/campaign/${campaign.id}`} variant="quiet" size="sm">상세 보기</ButtonLink>
              <a href={campaign.original_url} target="_blank" rel="noreferrer">원문 이동</a>
            </div>
          </article>
        );
      })}
    </section>
  );
}
