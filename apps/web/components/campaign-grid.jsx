import { CampaignCard } from '@/components/campaign-card';
import { SponsorSlot } from '@/components/sponsor-slot';

export function CampaignGrid({ campaigns, sponsor }) {
  if (!campaigns.length) {
    return (
      <section className="empty-state">
        <p>지금 조건에서는 맞는 캠페인이 적어요.</p>
        <span>지역·출처·확인 상태를 조금만 넓혀보면 더 많은 결과를 볼 수 있어요.</span>
      </section>
    );
  }

  return (
    <section className="campaign-grid">
      {campaigns.map((campaign, index) => (
        <FragmentWithSponsor
          key={campaign.id}
          campaign={campaign}
          sponsor={sponsor}
          showSponsor={index === 5}
        />
      ))}
    </section>
  );
}

function FragmentWithSponsor({ campaign, showSponsor, sponsor }) {
  return (
    <>
      <CampaignCard campaign={campaign} />
      {showSponsor && sponsor ? <SponsorSlot sponsor={sponsor} /> : null}
    </>
  );
}
