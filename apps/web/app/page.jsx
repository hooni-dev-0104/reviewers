import Link from 'next/link';

import { CampaignFeed } from '@/components/campaign-feed';
import { FilterBar } from '@/components/filter-bar';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getCampaignSearchCount, getCampaigns, getSources, getVisitorCounts } from '@/lib/supabase';
import { getBalancedHomepageCampaigns, isDefaultBrowse } from '@/lib/campaign-feed';
import { getActiveSponsor } from '@/lib/sponsor';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ searchParams }) {
  const query = await searchParams;
  return { alternates: { canonical: '/' }, robots: { index: !Object.keys(query).length, follow: true } };
}

export default async function HomePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const useBalancedFeed = isDefaultBrowse(resolvedSearchParams);
  const campaignsPromise = useBalancedFeed
    ? getBalancedHomepageCampaigns({ limit: 24 })
    : getCampaigns({ ...resolvedSearchParams, limit: 24, offset: 0 });

  const [campaigns, sources, visitorCounts, campaignCount, resultCount, sponsor] = await Promise.all([
    campaignsPromise,
    getSources(),
    getVisitorCounts(),
    getCampaignCount(),
    useBalancedFeed ? getCampaignCount() : getCampaignSearchCount(resolvedSearchParams),
    getActiveSponsor()
  ]);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={visitorCounts} />}>
      <section id="explore" className="explore-panel">
        <div className="browse-intro"><span className="eyebrow">무료 체험단 탐색</span><h1>내 일상에 맞는 경험을 찾아요.</h1><p>혜택과 지역, 마감을 비교하고 신청은 원문에서 확인하세요.</p></div>
        <FilterBar key={`filters:${JSON.stringify(resolvedSearchParams)}`} sources={sources} searchParams={resolvedSearchParams} />
        <CampaignFeed
          key={`feed:${JSON.stringify(resolvedSearchParams)}`}
          initialCampaigns={campaigns}
          sponsor={sponsor}
          searchParams={resolvedSearchParams}
          resultCount={resultCount}
          useBalancedFeed={useBalancedFeed}
        />
      </section>
    </SiteShell>
  );
}
