import { NextResponse } from 'next/server';

import { createBoardPost } from '@/lib/board';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  if (String(body.website || '').trim()) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  try {
    const post = await createBoardPost(body);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '글 작성에 실패했어요.' }, { status: 400 });
  }
}
