import { NextResponse } from 'next/server';

import { createSession, normalizeEmail, setSessionCookie, verifyPassword } from '@/lib/auth';
import { selectOne } from '@/lib/server-data';

export async function POST(request) {
  const body = await request.json();
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  const user = await selectOne('app_users', { select: 'id,email,display_name,password_hash', email: `eq.${email}` });
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: '이메일 또는 비밀번호가 맞지 않아요.' }, { status: 401 });
  }

  const session = await createSession(user.id);
  await setSessionCookie(session.token);
  return NextResponse.json({ user: { id: user.id, email: user.email, display_name: user.display_name } });
}
