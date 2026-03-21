import { CampaignCard } from '@/components/campaign-card';

export function CampaignGrid({ campaigns }) {
  if (!campaigns.length) {
    return (
      <section className="empty-state">
        <p>지금 조건에서는 맞는 캠페인이 적어요.</p>
        <span>지역·출처·신뢰도 필터를 조금만 넓혀보면 더 많은 결과를 볼 수 있어요.</span>
      </section>
    );
  }

  return (
    <section className="campaign-grid">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </section>
  );
}
