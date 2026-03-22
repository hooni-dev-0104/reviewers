import Link from 'next/link';

import { ActiveFilters } from '@/components/active-filters';
import { CampaignGrid } from '@/components/campaign-grid';
import { FilterBar } from '@/components/filter-bar';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getCampaigns, getSources, getVisitorCounts } from '@/lib/supabase';
import { getActiveSponsor } from '@/lib/sponsor';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const [campaigns, sources, visitorCounts, campaignCount, sponsor] = await Promise.all([
    getCampaigns({ ...resolvedSearchParams, limit: 48 }),
    getSources(),
    getVisitorCounts(),
    getCampaignCount(),
    getActiveSponsor()
  ]);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={visitorCounts} />}>
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">캠페인 한눈에 보기</span>
          <h1>
            오늘 볼 캠페인,
            <br />
            혜택과 마감부터 바로 보자.
          </h1>
          <p>
            레뷰·리뷰노트·포블로그·디너의여왕 데이터를 모아 혜택, 마감, 지역, 출처 순으로 먼저 확인할 수
            있게 정리했어요.
          </p>
          <div className="hero-actions">
            <Link href="#explore">결과 보기</Link>
            <Link href="/trust" className="ghost-link">
              확인 기준 보기
            </Link>
          </div>
          <div className="hero-reading-guide">
            <div>
              <strong>1</strong>
              <span>혜택 · 마감 먼저</span>
            </div>
            <div>
              <strong>2</strong>
              <span>지역 · 플랫폼으로 좁히기</span>
            </div>
            <div>
              <strong>3</strong>
              <span>괜찮은 카드만 원문 확인</span>
            </div>
          </div>
        </div>
        <div className="hero-sidecard">
          <div className="hero-sidecard-head">
            <span className="eyebrow">읽는 순서</span>
            <strong>먼저 확인할 것</strong>
          </div>
          <ul>
            <li>혜택이 선명하고 마감이 가까운 카드부터 보기</li>
            <li>지역과 플랫폼은 카드 안에서 바로 비교하기</li>
            <li>정보가 비어 있으면 원문에서 한 번 더 확인하기</li>
          </ul>
        </div>
      </section>

      <section className="stats-strip">
        <div>
          <strong>{campaigns.length.toLocaleString('ko-KR')}</strong>
          <span>지금 보이는 결과</span>
        </div>
        <div>
          <strong>{sources.length.toLocaleString('ko-KR')}</strong>
          <span>연결된 출처</span>
        </div>
        <div>
          <strong>4개</strong>
          <span>수집 소스</span>
        </div>
      </section>

      <section id="explore" className="explore-panel">
        <div className="section-headline">
          <div>
            <span className="eyebrow">결과 탐색</span>
            <h2>필터로 먼저 좁히고, 카드에서 바로 고르기</h2>
          </div>
          <p>불완전한 정보도 숨기지 않고 그대로 보여줘서, 클릭 전에 먼저 확인할 수 있게 했어요.</p>
        </div>

        <FilterBar sources={sources} searchParams={resolvedSearchParams} />
        <ActiveFilters searchParams={resolvedSearchParams} resultCount={campaigns.length} />
        <div className="feed-guidance">
          <div className="guidance-card">
            <strong>먼저 볼 것</strong>
            <span>혜택이 선명하고 마감이 가까운 카드부터 보면 판단이 빨라져요.</span>
          </div>
          <div className="guidance-card">
            <strong>다시 볼 것</strong>
            <span>정보가 약한 카드는 상세나 원문에서 한 번 더 확인해보세요.</span>
          </div>
        </div>
        <CampaignGrid campaigns={campaigns} sponsor={sponsor} />
      </section>
    </SiteShell>
  );
}
