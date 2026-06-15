import { CampaignCard } from '@/components/campaign-card';
import { SponsorSlot } from '@/components/sponsor-slot';
import { ButtonLink, EmptyState } from '@/components/ui';

export function CampaignGrid({ campaigns, sponsor }) {
  if (!campaigns.length) {
    return (
      <EmptyState
        title="조건에 맞는 캠페인이 없어요"
        body="지역이나 마감 조건을 넓히면 더 많은 캠페인을 보여드릴게요."
        action={<ButtonLink href="/" variant="quiet" size="sm" icon="refresh">조건 초기화</ButtonLink>}
      />
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
