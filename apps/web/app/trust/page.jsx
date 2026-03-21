import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getVisitorCounts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const TRUST_ITEMS = [
  {
    title: '정보 안정적',
    body: '혜택·마감일·모집 인원 중 핵심 판단 요소가 충분히 채워진 캠페인입니다.'
  },
  {
    title: '정보 보강 필요',
    body: '지원 판단은 가능하지만 마감일 또는 혜택 같은 일부 필드는 원문 확인이 필요합니다.'
  },
  {
    title: '검토 필요',
    body: '출처 특성상 요약, 혜택, 마감일이 약할 수 있어 상세 원문 검증이 필요한 캠페인입니다.'
  }
];

export default async function TrustPage() {
  const [counts, campaignCount] = await Promise.all([getVisitorCounts(), getCampaignCount()]);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <section className="trust-page">
        <span className="eyebrow">Trust system</span>
        <h1>리뷰어스는 정보 차이를 숨기지 않아요.</h1>
        <p>
          출처별 파싱 품질이 다르기 때문에, 카드와 상세 페이지에서 신뢰도 배지를 함께 보여줘요. 덕분에 클릭 전에도
          어떤 정보가 안정적이고 어떤 정보는 원문 확인이 필요한지 알 수 있어요.
        </p>

        <div className="decision-checklist">
          <div className="guidance-card">
            <strong>정보 안정적</strong>
            <span>혜택·마감·모집 인원 중 핵심 판단 정보가 충분한 상태예요.</span>
          </div>
          <div className="guidance-card">
            <strong>정보 보강 필요</strong>
            <span>지원 판단은 가능하지만 일부 정보는 상세 또는 원문 확인이 필요해요.</span>
          </div>
          <div className="guidance-card">
            <strong>검토 필요</strong>
            <span>요약과 실제 조건 차이가 있을 수 있어서 더 꼼꼼한 확인이 필요한 상태예요.</span>
          </div>
        </div>

        <div className="trust-grid">
          {TRUST_ITEMS.map((item) => (
            <article key={item.title} className="info-panel">
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
