import { getCampaigns } from '@/lib/supabase';

const MAX_MAP_CAMPAIGNS = 120;

export async function getMapCampaigns(searchParams = {}) {
  const campaigns = await getCampaigns({ ...searchParams, limit: 200, offset: 0 });
  return campaigns
    .filter(
      (campaign) =>
        campaign.campaign_type === 'visit' &&
        campaign.exact_location &&
        typeof campaign.latitude === 'number' &&
        typeof campaign.longitude === 'number'
    )
    .slice(0, MAX_MAP_CAMPAIGNS);
}
