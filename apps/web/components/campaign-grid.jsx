import { CampaignCard } from '@/components/campaign-card';
import { EmptyState } from '@/components/ui-kit';
import { SponsorSlot } from '@/components/sponsor-slot';

export function CampaignGrid({ campaigns, sponsor }) {
  if (!campaigns.length) {
    return (
      <EmptyState
        title="현재 조건에 맞는 캠페인이 적어요"
        description="지역, 출처, 마감을 조금만 넓혀보면 더 많은 후보를 확인할 수 있어요."
      />
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
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
