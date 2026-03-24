import { FilterBar } from '@/components/filter-bar';
import { MapExplorer } from '@/components/map-explorer';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getCampaigns, getSources, getVisitorCounts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function MapPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const [campaigns, sources, visitorCounts, campaignCount] = await Promise.all([
    getCampaigns({ ...resolvedSearchParams, limit: 160, offset: 0 }),
    getSources(),
    getVisitorCounts(),
    getCampaignCount()
  ]);

  const mappableCampaigns = campaigns
    .filter((campaign) => campaign.campaign_type === 'visit' && campaign.exact_location)
    .slice(0, 120);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={visitorCounts} />}>
      <section className="explore-panel map-page-shell">
        <FilterBar sources={sources} searchParams={resolvedSearchParams} />
        <MapExplorer campaigns={mappableCampaigns} />
      </section>
    </SiteShell>
  );
}
