import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { signOpsCookie, verifyOpsKey } from '@/lib/auth';
import { clearRateLimit, consumeRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const COOKIE_SECURE = process.env.NODE_ENV === 'production';

export async function POST(request) {
  if (!process.env.OPS_DASHBOARD_KEY) {
    return NextResponse.redirect(new URL('/ops', request.url));
  }
  const formData = await request.formData();
  const opsKey = String(formData.get('opsKey') || '');
  const limit = await consumeRateLimit(request, 'ops');
  if (!limit.allowed) {
    return rateLimitResponse(limit.retryAfter);
  }
  if (!(await verifyOpsKey(opsKey))) {
    return NextResponse.redirect(new URL('/ops', request.url));
  }

  await clearRateLimit('ops', limit.keyHash);
  const cookieStore = await cookies();
  cookieStore.set({
    name: 'rv_ops',
    value: signOpsCookie(),
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8
  });
  return NextResponse.redirect(new URL('/ops', request.url));
}
