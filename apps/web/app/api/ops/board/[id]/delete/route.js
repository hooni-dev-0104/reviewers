import { NextResponse } from 'next/server';

import { softDeleteBoardPost } from '@/lib/board';
import { isOpsAuthenticated } from '@/lib/ops';

export async function POST(request, { params }) {
  const authenticated = await isOpsAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: '운영 세션이 필요해요.' }, { status: 401 });
  }

  const { id } = await params;
  await softDeleteBoardPost(id);
  return NextResponse.redirect(new URL('/ops/board', request.url));
}
