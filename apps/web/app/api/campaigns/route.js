import { NextResponse } from 'next/server';

import { getBalancedHomepageCampaigns } from '@/lib/campaign-feed';
import { getCampaigns, getCampaignsByIds } from '@/lib/supabase';

export async function GET(request) {
  const idsParam = request.nextUrl.searchParams.get('ids') || '';

  if (idsParam) {
    const ids = idsParam
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 50);

    const items = await getCampaignsByIds(ids);
    return NextResponse.json({ items });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = {
    search: searchParams.get('search') || '',
    platform: searchParams.get('platform') || 'all',
    type: searchParams.get('type') || 'all',
    source: searchParams.get('source') || 'all',
    region: searchParams.get('region') || '',
    regionPrimary: searchParams.get('regionPrimary') || 'all',
    regionSecondary: searchParams.get('regionSecondary') || 'all',
    deadline: searchParams.get('deadline') || 'all',
    trust: searchParams.get('trust') || 'all',
    sort: searchParams.get('sort') || 'deadline',
    limit: Math.min(Number(searchParams.get('limit') || 24), 48),
    offset: Math.max(Number(searchParams.get('offset') || 0), 0)
  };

  const items = searchParams.get('balanced') === '1'
    ? await getBalancedHomepageCampaigns({ offset: query.offset, limit: query.limit })
    : await getCampaigns(query);

  return NextResponse.json({ items });
}
