import { SavedCampaignsView } from '@/components/saved-campaigns-view';
import { PageHero } from '@/components/ui-kit';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getVisitorCounts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function SavedPage() {
  const [counts, campaignCount] = await Promise.all([getVisitorCounts(), getCampaignCount()]);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <PageHero
        eyebrow="Saved workflow"
        title="나중에 다시 볼 캠페인을 깔끔하게 저장하고 비교하세요"
        description="저장 목록을 별도 화면으로 분리하고 핵심 메타데이터만 남겨 다시 보는 흐름을 단순화했습니다."
        stats={[
          { label: '사용 목적', value: '다시 비교', hint: '혜택과 마감을 재검토' },
          { label: '리스트 구조', value: '핵심 메타 중심', hint: '소스 / 유형 / 일정' },
          { label: 'CTA', value: '상세 + 원문', hint: '두 단계 행동 분리' }
        ]}
      />
      <SavedCampaignsView />
    </SiteShell>
  );
}
