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

const STORAGE_KEY = 'reviewers.savedCampaignIds';

export function SavedCampaignsView() {
  const [ids, setIds] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      const nextIds = readSavedIds();
      setIds(nextIds);
      if (!nextIds.length) {
        setCampaigns([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      fetch(`/api/campaigns?ids=${nextIds.join(',')}`)
        .then((response) => response.json())
        .then((payload) => setCampaigns(Array.isArray(payload.items) ? payload.items : []))
        .finally(() => setLoading(false));
    };

    sync();
    window.addEventListener('reviewers:saved-updated', sync);
    return () => window.removeEventListener('reviewers:saved-updated', sync);
  }, []);

  const ordered = useMemo(() => {
    const byId = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
    return ids.map((id) => byId.get(id)).filter(Boolean);
  }, [campaigns, ids]);

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

function readSavedIds() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (_error) {
    return [];
  }
}
