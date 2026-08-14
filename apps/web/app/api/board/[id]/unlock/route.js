import { NextResponse } from 'next/server';

import { unlockPrivateBoardPost } from '@/lib/board';
import { clearRateLimit, consumeRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const nickname = String(body.nickname || '');
  const password = String(body.password || '');
  const limit = await consumeRateLimit(request, 'unlock', id);
  if (!limit.allowed) {
    return rateLimitResponse(limit.retryAfter);
  }

  if (!nickname.trim() || !password.trim()) {
    return NextResponse.json({ error: '닉네임과 비밀번호를 입력해 주세요.' }, { status: 400 });
  }

  const post = await unlockPrivateBoardPost(id, nickname, password);
  if (!post) {
    return NextResponse.json({ error: '닉네임 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  await clearRateLimit('unlock', limit.keyHash);
  return NextResponse.json({ post });
}
