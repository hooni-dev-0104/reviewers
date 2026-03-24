import { getCampaigns } from '@/lib/supabase';

const MAX_MAP_CAMPAIGNS = 120;
const MAP_FETCH_BATCH = 200;
const MAX_MAP_SCAN = 2000;

export async function getMapCampaigns(searchParams = {}) {
  const matches = [];
  const seenIds = new Set();

  for (let offset = 0; offset < MAX_MAP_SCAN && matches.length < MAX_MAP_CAMPAIGNS; offset += MAP_FETCH_BATCH) {
    const campaigns = await getCampaigns({ ...searchParams, limit: MAP_FETCH_BATCH, offset });
    if (!campaigns.length) {
      break;
    }

    for (const campaign of campaigns) {
      if (!supportsMapCampaign(campaign) || seenIds.has(campaign.id)) {
        continue;
      }

      seenIds.add(campaign.id);
      matches.push(campaign);

      if (matches.length >= MAX_MAP_CAMPAIGNS) {
        break;
      }
    }

    if (campaigns.length < MAP_FETCH_BATCH) {
      break;
    }
  }

  return matches;
}

function supportsMapCampaign(campaign) {
  return (
    campaign?.campaign_type === 'visit' &&
    Boolean(campaign?.exact_location) &&
    Number.isFinite(campaign?.latitude) &&
    Number.isFinite(campaign?.longitude)
  );
}
