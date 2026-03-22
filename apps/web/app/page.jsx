import Link from 'next/link';

import { ActiveFilters } from '@/components/active-filters';
import { CampaignGrid } from '@/components/campaign-grid';
import { FilterBar } from '@/components/filter-bar';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getCampaigns, getSources, getVisitorCounts } from '@/lib/supabase';
import { getActiveSponsor } from '@/lib/sponsor';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const campaignsPromise = isDefaultBrowse(resolvedSearchParams)
    ? getBalancedHomepageCampaigns()
    : getCampaigns({ ...resolvedSearchParams, limit: 48 });

  const [campaigns, sources, visitorCounts, campaignCount, sponsor] = await Promise.all([
    campaignsPromise,
    getSources(),
    getVisitorCounts(),
    getCampaignCount(),
    getActiveSponsor()
  ]);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={visitorCounts} />}>
      <section className="stats-strip">
        <div>
          <strong>{campaigns.length.toLocaleString('ko-KR')}</strong>
          <span>지금 나온 캠페인</span>
        </div>
        <div>
          <strong>{sources.length.toLocaleString('ko-KR')}</strong>
          <span>현재 수집 중인 출처</span>
        </div>
        <div>
          <strong>4개</strong>
          <span>수집 플랫폼</span>
        </div>
      </section>

      <section id="explore" className="explore-panel">
        <div className="section-headline">
          <div>
            <span className="eyebrow">캠페인 찾기</span>
            <h2>필터로 먼저 좁히고, 카드에서 바로 고르기</h2>
          </div>
          <p>기본 화면은 출처를 고르게 섞어서 보여줘서, 여러 사이트 캠페인을 한 번에 비교하기 쉬워요.</p>
        </div>

        <FilterBar sources={sources} searchParams={resolvedSearchParams} />
        <ActiveFilters searchParams={resolvedSearchParams} resultCount={campaigns.length} />
        <CampaignGrid campaigns={campaigns} sponsor={sponsor} />
      </section>
    </SiteShell>
  );
}

async function getBalancedHomepageCampaigns() {
  const perSource = await Promise.all(
    ['revu', 'reviewnote', 'dinnerqueen', '4blog'].map((source) =>
      getCampaigns({ source, sort: 'deadline', limit: 16 })
    )
  );

  const merged = [];
  const seen = new Set();
  const maxLength = Math.max(...perSource.map((items) => items.length), 0);

  for (let index = 0; index < maxLength; index += 1) {
    for (const group of perSource) {
      const item = group[index];
      if (!item || seen.has(item.id)) {
        continue;
      }
      merged.push(item);
      seen.add(item.id);
      if (merged.length >= 48) {
        return merged;
      }
    }
  }

  return merged;
}

function isDefaultBrowse(searchParams) {
  const entries = Object.entries(searchParams || {}).filter(([, value]) => value !== undefined && value !== '');
  if (!entries.length) {
    return true;
  }

  return entries.every(([key, value]) => {
    if (key === 'sort') {
      return value === 'deadline';
    }
    return value === 'all';
  });
}
