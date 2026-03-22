'use client';

import { useState, useTransition } from 'react';

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
  const [isPending, startTransition] = useTransition();

  const hasMore = campaigns.length < resultCount;

  function handleLoadMore() {
    startTransition(async () => {
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

      const response = await fetch(`/api/campaigns?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const nextItems = Array.isArray(data.items) ? data.items : [];
      if (!nextItems.length) {
        return;
      }

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
    });
  }

  return (
    <>
      <ActiveFilters searchParams={searchParams} resultCount={resultCount} />
      <CampaignGrid campaigns={campaigns} sponsor={sponsor} />
      {hasMore ? (
        <div className="load-more-row">
          <button type="button" className="load-more-button" onClick={handleLoadMore} disabled={isPending}>
            {isPending ? '불러오는 중…' : '캠페인 더 보기'}
          </button>
        </div>
      ) : null}
    </>
  );
}
