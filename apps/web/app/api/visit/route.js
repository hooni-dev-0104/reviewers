import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getVisitorCounts, recordVisitor } from '@/lib/supabase';

export async function POST(request) {
  const cookieStore = await cookies();
  const existingVisitorId = cookieStore.get('rv_vid')?.value;
  const visitorId = existingVisitorId || crypto.randomUUID();
  const payload = await readJsonBody(request);
  const counts = await recordVisitor({ visitorId, path: payload.path || '/' });

  const response = NextResponse.json(counts);
  if (!existingVisitorId) {
    response.cookies.set({
      name: 'rv_vid',
      value: visitorId,
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 365
    });
  }
  return response;
}

export async function GET() {
  return NextResponse.json(await getVisitorCounts());
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch (_error) {
    return {};
  }
}
