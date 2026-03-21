import { NextResponse } from 'next/server';

import { createSession, hashPassword, normalizeEmail, setSessionCookie, validatePassword } from '@/lib/auth';
import { insertRows, selectOne } from '@/lib/server-data';

export async function POST(request) {
  const body = await request.json();
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const displayName = String(body.displayName || '').trim() || null;

  if (!email) {
    return NextResponse.json({ error: '이메일을 입력해 주세요.' }, { status: 400 });
  }
  if (!validatePassword(password)) {
    return NextResponse.json({ error: '비밀번호는 8자 이상이어야 해요.' }, { status: 400 });
  }

  const existing = await selectOne('app_users', { select: 'id', email: `eq.${email}` });
  if (existing) {
    return NextResponse.json({ error: '이미 가입된 이메일이에요.' }, { status: 409 });
  }

  const rows = await insertRows('app_users', [{ email, display_name: displayName, password_hash: hashPassword(password) }]);
  const user = rows?.[0];
  const session = await createSession(user.id);
  await setSessionCookie(session.token);
  return NextResponse.json({ user: { id: user.id, email: user.email, display_name: user.display_name } });
}
