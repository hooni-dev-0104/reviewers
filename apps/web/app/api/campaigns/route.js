import { NextResponse } from 'next/server';

import { getCampaignsByIds } from '@/lib/supabase';

export async function GET(request) {
  const idsParam = request.nextUrl.searchParams.get('ids') || '';
  const ids = idsParam
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 50);

  const items = await getCampaignsByIds(ids);
  return NextResponse.json({ items });
}
