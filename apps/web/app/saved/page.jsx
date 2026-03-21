import { SavedCampaignsView } from '@/components/saved-campaigns-view';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getVisitorCounts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function SavedPage() {
  const [counts, campaignCount] = await Promise.all([getVisitorCounts(), getCampaignCount()]);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <section className="trust-page saved-page">
        <span className="eyebrow">Saved list</span>
        <h1>나중에 다시 볼 체험단을 모아두자.</h1>
        <p>카드나 상세 페이지에서 저장한 캠페인을 여기서 다시 확인할 수 있어요. 마감 전에 빠르게 재검토하기 좋아요.</p>
        <SavedCampaignsView />
      </section>
    </SiteShell>
  );
}
