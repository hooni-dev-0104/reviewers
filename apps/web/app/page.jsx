import { CampaignFeed } from '@/components/campaign-feed';
import { FilterBar } from '@/components/filter-bar';
import { PageHero, ButtonLink, Surface } from '@/components/ui-kit';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { formatCount } from '@/lib/format';
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
      <PageHero
        eyebrow="Modern campaign workflow"
        title="흩어진 체험단 정보를 한 곳에 모아 더 빠르게 비교하고 선택하세요"
        description="오래된 리스트 UI 대신 혜택, 마감, 지역, 소스를 한눈에 정리한 카드 구조와 명확한 CTA로 탐색 전환율을 높이도록 재구성했습니다."
        actions={[
          <ButtonLink key="explore" href="#explore" variant="primary" size="lg">캠페인 바로 보기</ButtonLink>,
          <ButtonLink key="map" href="/map" variant="secondary" size="lg">지도에서 찾기</ButtonLink>
        ]}
        stats={[
          { label: '활성 캠페인', value: formatCount(campaignCount), hint: '실시간 비교 가능한 후보' },
          { label: '오늘 방문', value: formatCount(visitorCounts.daily), hint: '지금 탐색 중인 사용자' },
          { label: '데이터 소스', value: formatCount(sources.length), hint: '한 곳에서 묶어서 탐색' }
        ]}
        aside={(
          <>
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Why this redesign</span>
              <h2 className="text-[24px] font-semibold tracking-[-0.04em] text-slate-950">더 명확한 계층과 더 빠른 의사결정</h2>
            </div>
            <div className="space-y-4 text-sm leading-7 text-slate-600">
              <p>8px spacing system, 일관된 타이포그래피, 통일된 상태 배지와 CTA 계층을 적용했습니다.</p>
              <ul className="space-y-3">
                <li>• 검색 → 필터 → 카드 → 상세로 이어지는 흐름을 단순화</li>
                <li>• 모바일에서도 카드 정보가 잘리는 대신 요약 우선순위 유지</li>
                <li>• 저장, 리마인드, 상세 CTA를 더 명확하게 배치</li>
              </ul>
            </div>
          </>
        )}
      />

      <Surface id="explore" className="space-y-6 p-4 sm:space-y-8 sm:p-8">
        <FilterBar sources={sources} searchParams={resolvedSearchParams} />
        <CampaignFeed
          initialCampaigns={campaigns}
          sponsor={sponsor}
          searchParams={resolvedSearchParams}
          resultCount={resultCount}
          useBalancedFeed={useBalancedFeed}
        />
      </Surface>
    </SiteShell>
  );
}
