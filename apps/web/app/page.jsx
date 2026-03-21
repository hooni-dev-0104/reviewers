import Link from 'next/link';

import { ActiveFilters } from '@/components/active-filters';
import { CampaignGrid } from '@/components/campaign-grid';
import { FilterBar } from '@/components/filter-bar';
import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getCampaigns, getSources, getVisitorCounts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const [campaigns, sources, visitorCounts, campaignCount] = await Promise.all([
    getCampaigns({ ...resolvedSearchParams, limit: 48 }),
    getSources(),
    getVisitorCounts(),
    getCampaignCount()
  ]);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={visitorCounts} />}>
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Applicant-first campaign finder</span>
          <h1>오늘 지원할 체험단을 더 빠르게, 더 자신 있게 고르자.</h1>
          <p>
            레뷰·리뷰노트·포블로그·디너의여왕 데이터를 한 번에 모아, 마감일·혜택·출처 신뢰도를 중심으로
            빠르게 판단할 수 있게 만들었어요.
          </p>
          <div className="hero-actions">
            <Link href="#explore">지금 둘러보기</Link>
            <Link href="/trust" className="ghost-link">
              신뢰 기준 보기
            </Link>
          </div>
        </div>
        <div className="hero-sidecard">
          <div>
            <strong>요즘 잘 보는 기준</strong>
            <span>마감 임박 · 혜택 선명 · 출처 안정성</span>
          </div>
          <ul>
            <li>급한 마감은 카드에서 바로 표시</li>
            <li>정보가 부족한 캠페인은 검토 필요 배지 제공</li>
            <li>클릭 전에도 혜택/지역/인원 빠르게 확인</li>
          </ul>
        </div>
      </section>

      <section className="stats-strip">
        <div>
          <strong>{campaigns.length.toLocaleString('ko-KR')}</strong>
          <span>현재 조건 결과</span>
        </div>
        <div>
          <strong>{sources.length.toLocaleString('ko-KR')}</strong>
          <span>활성 출처</span>
        </div>
        <div>
          <strong>4개</strong>
          <span>핵심 수집 소스</span>
        </div>
      </section>

      <section id="explore" className="explore-panel">
        <div className="section-headline">
          <div>
            <span className="eyebrow">Explore</span>
            <h2>필터로 바로 좁히고, 카드에서 바로 판단하기</h2>
          </div>
          <p>불완전한 데이터는 숨기지 않고 그대로 보여줘서 클릭 전에 더 정확하게 판단할 수 있어요.</p>
        </div>

        <FilterBar sources={sources} searchParams={resolvedSearchParams} />
        <ActiveFilters searchParams={resolvedSearchParams} resultCount={campaigns.length} />
        <CampaignGrid campaigns={campaigns} />
      </section>
    </SiteShell>
  );
}
