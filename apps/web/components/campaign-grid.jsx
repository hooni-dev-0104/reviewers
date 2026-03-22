import { CampaignCard } from '@/components/campaign-card';
import { SponsorSlot } from '@/components/sponsor-slot';

export function CampaignGrid({ campaigns, sponsor }) {
  if (!campaigns.length) {
    return (
      <section className="empty-state">
        <p>현재 조건에 맞는 캠페인이 적어요.</p>
        <span>지역·출처·마감을 조금만 넓혀보세요.</span>
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
