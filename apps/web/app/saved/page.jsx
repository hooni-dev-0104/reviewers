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
        <span className="eyebrow">저장한 캠페인</span>
        <h1>나중에 다시 볼 체험단을 모아두자.</h1>
        <p>마음에 들었던 캠페인을 여기 모아두고, 마감 전에 다시 비교해볼 수 있어요.</p>
        <div className="decision-checklist">
          <div className="guidance-card">
            <strong>오늘 다시 볼 항목</strong>
            <span>마감이 가까운 카드부터 원문으로 넘어가면 우선순위 정리가 쉬워져요.</span>
          </div>
          <div className="guidance-card">
            <strong>비교용 저장</strong>
            <span>혜택이나 위치가 헷갈리는 캠페인을 저장해두고 차분히 다시 비교하세요.</span>
          </div>
        </div>
        <SavedCampaignsView />
      </section>
    </SiteShell>
  );
}
