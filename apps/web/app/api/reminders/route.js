import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { deleteReminder, getReminder, upsertReminder } from '@/lib/reminders';

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
