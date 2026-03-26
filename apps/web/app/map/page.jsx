import { FilterBar } from '@/components/filter-bar';
import { MapExplorer } from '@/components/map-explorer';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getSources, getVisitorCounts } from '@/lib/supabase';
import { getMapCampaigns } from '@/lib/map-data';

export const dynamic = 'force-dynamic';

export default async function MapPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const [campaigns, sources, visitorCounts, campaignCount] = await Promise.all([
    getMapCampaigns(resolvedSearchParams),
    getSources(),
    getVisitorCounts(),
    getCampaignCount()
  ]);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={visitorCounts} />}>
      <section className="explore-panel map-page-shell">
        <FilterBar sources={sources} searchParams={resolvedSearchParams} />
        <MapExplorer campaigns={campaigns} />
      </section>
    </SiteShell>
  );
}
