import { FilterBar } from '@/components/filter-bar';
import { MapExplorer } from '@/components/map-explorer';
import { PageHero, ButtonLink, Surface } from '@/components/ui-kit';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { formatCount } from '@/lib/format';
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
      <PageHero
        eyebrow="Location-first workflow"
        title="지역 중심으로 캠페인을 찾고 동선까지 빠르게 확인하세요"
        description="지도와 리스트를 병렬로 구성해 위치 기반 판단을 더 빠르게 할 수 있게 했습니다. 모바일에서는 리스트 우선, 데스크톱에서는 지도를 함께 보도록 설계했습니다."
        actions={[
          <ButtonLink key="list" href="/" variant="secondary" size="lg">목록으로 보기</ButtonLink>,
          <ButtonLink key="board" href="/board" variant="primary" size="lg">게시판 가기</ButtonLink>
        ]}
        stats={[
          { label: '지도 후보', value: formatCount(campaigns.length), hint: '정확 좌표가 있는 캠페인' },
          { label: '활성 소스', value: formatCount(sources.length), hint: '필터 가능한 데이터 소스' },
          { label: '오늘 방문', value: formatCount(visitorCounts.daily), hint: '실시간 사용 흐름' }
        ]}
      />

      <Surface className="space-y-6 p-4 sm:space-y-8 sm:p-8">
        <FilterBar sources={sources} searchParams={resolvedSearchParams} />
        <MapExplorer campaigns={campaigns} />
      </Surface>
    </SiteShell>
  );
}
