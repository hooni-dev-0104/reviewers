import Script from 'next/script';

import { FilterBar } from '@/components/filter-bar';
import { MapExplorer } from '@/components/map-explorer';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getSources, getVisitorCounts } from '@/lib/supabase';
import { getMapCampaigns } from '@/lib/map-data';

export const dynamic = 'force-dynamic';

const VWORLD_API_KEY = process.env.NEXT_PUBLIC_VWORLD_API_KEY;
const VWORLD_DOMAIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://reviewkok.vercel.app').hostname;
  } catch {
    return 'reviewkok.vercel.app';
  }
})();

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
      {VWORLD_API_KEY ? (
        <Script
          id="reviewkok-vworld-loader"
          src={`https://map.vworld.kr/js/vworldMapInit.js.do?version=2.0&apiKey=${encodeURIComponent(VWORLD_API_KEY)}&domain=${encodeURIComponent(VWORLD_DOMAIN)}`}
          strategy="beforeInteractive"
        />
      ) : null}
      <section className="explore-panel map-page-shell">
        <FilterBar sources={sources} searchParams={resolvedSearchParams} />
        <MapExplorer campaigns={campaigns} />
      </section>
    </SiteShell>
  );
}
