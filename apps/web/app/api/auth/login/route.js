import { NextResponse } from 'next/server';

import { createSession, normalizeEmail, setSessionCookie, verifyPassword } from '@/lib/auth';
import { selectOne } from '@/lib/server-data';
import { clearRateLimit, consumeRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request) {
  const body = await request.json();
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const limit = await consumeRateLimit(request, 'login', email);
  if (!limit.allowed) {
    return rateLimitResponse(limit.retryAfter);
  }

  const user = await selectOne('app_users', { select: 'id,email,display_name,password_hash', email: `eq.${email}` });
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: '이메일 또는 비밀번호가 맞지 않아요.' }, { status: 401 });
  }

  const session = await createSession(user.id);
  await setSessionCookie(session.token);
  await clearRateLimit('login', limit.keyHash);
  return NextResponse.json({ user: { id: user.id, email: user.email, display_name: user.display_name } });
}
