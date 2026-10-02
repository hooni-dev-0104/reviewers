'use client';

import { useState, useRef, useEffect } from 'react';

import { ActiveFilters } from '@/components/active-filters';
import { CampaignGrid } from '@/components/campaign-grid';

const PAGE_SIZE = 24;

export function CampaignFeed({
  initialCampaigns,
  sponsor,
  searchParams,
  resultCount,
  useBalancedFeed
}) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [ended, setEnded] = useState(false);
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);

  const hasMore = !ended && campaigns.length < resultCount;

  async function handleLoadMore() {
    if (controller.current) return;
    const active = new AbortController();
    controller.current = active;
    setPending(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(searchParams || {})) {
        if (value !== undefined && value !== '') {
          params.set(key, value);
        }
      }
      params.set('offset', String(campaigns.length));
      params.set('limit', String(PAGE_SIZE));
      if (useBalancedFeed) {
        params.set('balanced', '1');
      }

      const response = await fetch(`/api/campaigns?${params.toString()}`, { cache: 'no-store', signal: active.signal });
      if (!response.ok) throw new Error('load failed');

      const data = await response.json();
      const nextItems = Array.isArray(data.items) ? data.items : [];
      if (nextItems.length < PAGE_SIZE) setEnded(true);
      if (!nextItems.length) return;

      setCampaigns((current) => {
        const seen = new Set(current.map((item) => item.id));
        const merged = [...current];
        for (const item of nextItems) {
          if (!seen.has(item.id)) {
            merged.push(item);
            seen.add(item.id);
          }
        }
        return merged;
      });
    } catch (failure) {
      if (failure.name !== 'AbortError') setError(true);
    } finally {
      controller.current = null;
      setPending(false);
    }
  }

  return (
    <>
      <ActiveFilters searchParams={searchParams} resultCount={resultCount} />
      <CampaignGrid campaigns={campaigns} sponsor={sponsor} />
      {error ? <p role="alert" className="feed-status">목록을 불러오지 못했어요. 아래에서 다시 시도해 주세요.</p> : null}
      {hasMore ? (
        <div className="load-more-row">
          <button type="button" className="load-more-button" onClick={handleLoadMore} disabled={isPending}>
            {isPending ? '불러오는 중…' : error ? '다시 시도' : '캠페인 더 보기'}
          </button>
        </div>
      ) : campaigns.length ? <p className="feed-status" role="status">모든 캠페인을 확인했어요.</p> : null}
    </>
  );
}
