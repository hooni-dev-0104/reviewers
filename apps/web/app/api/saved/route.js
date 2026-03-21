import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { deleteRows, selectRows, upsertRows } from '@/lib/server-data';
import { getCampaignsByIds } from '@/lib/supabase';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ids: [], items: [] });
  }

  const rows = await selectRows('user_saved_campaigns', {
    select: 'campaign_id',
    user_id: `eq.${user.id}`,
    order: 'created_at.desc',
    limit: '100'
  });
  const ids = rows.map((row) => row.campaign_id);
  const items = await getCampaignsByIds(ids);
  return NextResponse.json({ ids, items });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });
  }

  const body = await request.json();
  const campaignId = String(body.campaignId || '');
  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId가 필요해요.' }, { status: 400 });
  }

  const existing = await selectRows('user_saved_campaigns', {
    select: 'id,campaign_id',
    user_id: `eq.${user.id}`,
    campaign_id: `eq.${campaignId}`,
    limit: '1'
  });

  if (existing.length) {
    await deleteRows('user_saved_campaigns', { user_id: `eq.${user.id}`, campaign_id: `eq.${campaignId}` });
  } else {
    await upsertRows('user_saved_campaigns', [{ user_id: user.id, campaign_id: campaignId }], 'user_id,campaign_id', 'resolution=merge-duplicates,return=minimal');
  }

  const refreshed = await selectRows('user_saved_campaigns', {
    select: 'campaign_id',
    user_id: `eq.${user.id}`,
    order: 'created_at.desc',
    limit: '100'
  });
  const ids = refreshed.map((row) => row.campaign_id);
  return NextResponse.json({ ids, saved: !existing.length });
}
