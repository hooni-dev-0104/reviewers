import { unstable_cache } from 'next/cache';

import { getCampaigns } from '@/lib/supabase';

const MAX_MAP_CAMPAIGNS = 80;

const geocodeExactLocation = unstable_cache(
  async (exactLocation) => {
    if (!exactLocation) {
      return null;
    }

    const params = new URLSearchParams({
      q: exactLocation,
      format: 'jsonv2',
      limit: '1',
      countrycodes: 'kr',
      addressdetails: '0'
    });

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: {
          'User-Agent': 'ReviewKokMapGeocoder/1.0 (reviewkok.vercel.app)',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
        },
        next: { revalidate: 60 * 60 * 24 }
      });

      if (!response.ok) {
        return null;
      }

      const rows = await response.json();
      const first = rows[0];
      if (!first?.lat || !first?.lon) {
        return null;
      }

      return {
        latitude: Number(first.lat),
        longitude: Number(first.lon)
      };
    } catch {
      return null;
    }
  },
  ['reviewkok-map-geocoder'],
  { revalidate: 60 * 60 * 24 }
);

export async function getMapCampaigns(searchParams = {}) {
  const campaigns = await getCampaigns({ ...searchParams, limit: 160, offset: 0 });
  const mappableCampaigns = campaigns
    .filter((campaign) => campaign.campaign_type === 'visit' && campaign.exact_location)
    .slice(0, MAX_MAP_CAMPAIGNS);

  const geocoded = [];
  for (const campaign of mappableCampaigns) {
    const point = await geocodeExactLocation(campaign.exact_location);
    if (point) {
      geocoded.push({
        ...campaign,
        ...point
      });
    }
  }

  return geocoded;
}
