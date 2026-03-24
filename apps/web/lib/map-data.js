import { getMapEligibleCampaigns } from '@/lib/supabase';

const MAX_MAP_CAMPAIGNS = 120;

export async function getMapCampaigns(searchParams = {}) {
  const campaigns = await getMapEligibleCampaigns(searchParams);
  return campaigns.slice(0, MAX_MAP_CAMPAIGNS);
}
