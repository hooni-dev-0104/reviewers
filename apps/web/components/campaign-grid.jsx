import { CampaignCard } from '@/components/campaign-card';
import { SponsorSlot } from '@/components/sponsor-slot';

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
      {campaigns.map((campaign, index) => (
        <FragmentWithSponsor
          key={campaign.id}
          campaign={campaign}
          showSponsor={index === 5}
        />
      ))}
    </section>
  );
}

function FragmentWithSponsor({ campaign, showSponsor }) {
  return (
    <>
      <CampaignCard campaign={campaign} />
      {showSponsor ? <SponsorSlot /> : null}
    </>
  );
}
