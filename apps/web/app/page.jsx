import Link from 'next/link';

import { CampaignFeed } from '@/components/campaign-feed';
import { FilterBar } from '@/components/filter-bar';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getCampaignSearchCount, getCampaigns, getSources, getVisitorCounts } from '@/lib/supabase';
import { getBalancedHomepageCampaigns, isDefaultBrowse } from '@/lib/campaign-feed';
import { getActiveSponsor } from '@/lib/sponsor';

export const dynamic = 'force-dynamic';

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
        <div className="section-headline compact-single">
          <div>
            <span className="eyebrow">리뷰콕</span>
            <h2>조건 맞는 체험단만 빠르게 골라보기</h2>
          </div>
        </div>

        <FilterBar sources={sources} searchParams={resolvedSearchParams} />
        <CampaignFeed
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
