import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { requireOpsKey, signOpsCookie } from '@/lib/auth';

export async function POST(request) {
  if (!process.env.OPS_DASHBOARD_KEY) {
    return NextResponse.redirect(new URL('/ops', request.url));
  }
  const formData = await request.formData();
  const opsKey = String(formData.get('opsKey') || '');
  if (!requireOpsKey(opsKey)) {
    return NextResponse.redirect(new URL('/ops', request.url));
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: 'rv_ops',
    value: signOpsCookie(),
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8
  });
  return NextResponse.redirect(new URL('/ops', request.url));
}
