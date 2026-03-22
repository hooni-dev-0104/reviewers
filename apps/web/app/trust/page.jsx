import { SiteShell } from '@/components/site-shell';
import { VisitorWidget } from '@/components/visitor-widget';
import { getCampaignCount, getVisitorCounts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const TRUST_ITEMS = [
  {
    title: '핵심 정보 충분',
    body: '혜택·마감일·모집 인원 같은 핵심 정보가 충분해 바로 비교할 수 있어요.'
  },
  {
    title: '정보 일부 확인',
    body: '지원 판단은 가능하지만 일부 항목은 원문에서 한 번 더 확인해 보세요.'
  },
  {
    title: '원문 참고',
    body: '요약만으로는 판단이 어려워 상세 원문을 함께 보는 편이 좋아요.'
  }
];

export default async function TrustPage() {
  const [counts, campaignCount] = await Promise.all([getVisitorCounts(), getCampaignCount()]);

  return (
    <SiteShell campaignCount={campaignCount} visitorWidget={<VisitorWidget initialCounts={counts} />}>
      <section className="trust-page">
        <span className="eyebrow">정보 상태</span>
        <h1>카드의 정보는 이렇게 읽어요.</h1>
        <p>
          출처마다 정리된 정보의 밀도가 달라서, 카드와 상세 페이지에 먼저 보여줄 내용만 나눠두었어요.
          어떤 정보는 바로 비교해도 되고, 어떤 정보는 원문을 함께 봐야 하는지 한눈에 볼 수 있어요.
        </p>

        <div className="decision-checklist">
          <div className="guidance-card">
            <strong>무엇을 먼저 보나요?</strong>
            <span>혜택, 마감일, 모집 인원 순으로 핵심 정보부터 봐요.</span>
          </div>
          <div className="guidance-card">
            <strong>언제 원문을 열어야 하나요?</strong>
            <span>필수 정보가 비어 있거나 조건이 애매하면 상세 원문을 바로 열어보세요.</span>
          </div>
          <div className="guidance-card">
            <strong>무엇을 조심해야 하나요?</strong>
            <span>요약과 실제 조건이 다를 수 있어 출처가 약한 캠페인은 원문을 더 봐야 해요.</span>
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
