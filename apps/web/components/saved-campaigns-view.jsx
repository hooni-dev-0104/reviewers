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
      <section className="empty-state">
        <p>저장 목록은 로그인 후 사용할 수 있어요.</p>
        <span>계정을 만들면 저장한 캠페인을 브라우저가 바뀌어도 이어서 볼 수 있어요.</span>
      </section>
    );
  }

  if (loading) {
    return <section className="empty-state"><p>저장한 캠페인을 불러오는 중이에요.</p></section>;
  }

  if (!ordered.length) {
    return (
      <section className="empty-state">
        <p>아직 저장한 캠페인이 없어요.</p>
        <span>마음에 드는 카드에서 저장 버튼을 눌러두면 여기서 다시 볼 수 있어요.</span>
      </section>
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
                <span className={`badge badge-${confidence.tone}`}>{confidence.label}</span>
              </div>
              <h3>{campaign.title}</h3>
              <div className="chip-row compact-row">
                <span>{formatPlatform(campaign.platform_type)}</span>
                <span>{formatCampaignType(campaign.campaign_type)}</span>
                <span>{formatRegion(campaign)}</span>
                <span>{formatDeadline(campaign.apply_deadline)}</span>
              </div>
            </div>
            <div className="saved-actions">
              <Link href={`/campaign/${campaign.id}`}>상세 보기</Link>
              <a href={campaign.original_url} target="_blank" rel="noreferrer">원문 이동</a>
            </div>
          </article>
        );
      })}
    </section>
  );
}
