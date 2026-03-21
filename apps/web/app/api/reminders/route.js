import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { deleteReminder, getReminder, upsertReminder } from '@/lib/reminders';
import { getCampaignById } from '@/lib/supabase';

const ALLOWED_HOURS = new Set([3, 24, 72]);

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ item: null }, { status: 200 });
  }

  const campaignId = request.nextUrl.searchParams.get('campaignId');
  if (!campaignId) {
    return NextResponse.json({ item: null });
  }

  const item = await getReminder(user.id, campaignId);
  return NextResponse.json({ item });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });
  }

  const body = await request.json();
  const campaignId = String(body.campaignId || '');
  const remindBeforeHours = Number(body.remindBeforeHours || 24);
  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId가 필요해요.' }, { status: 400 });
  }
  if (!ALLOWED_HOURS.has(remindBeforeHours)) {
    return NextResponse.json({ error: '지원하지 않는 리마인드 시간이예요.' }, { status: 400 });
  }
  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    return NextResponse.json({ error: '존재하지 않거나 비활성화된 캠페인이에요.' }, { status: 404 });
  }
  const item = await upsertReminder(user.id, campaignId, remindBeforeHours);
  return NextResponse.json({ item });
}

export async function DELETE(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });
  }

  const campaignId = request.nextUrl.searchParams.get('campaignId');
  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId가 필요해요.' }, { status: 400 });
  }

  await deleteReminder(user.id, campaignId);
  return NextResponse.json({ ok: true });
}
