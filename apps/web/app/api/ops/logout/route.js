import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const cookieStore = await cookies();
  cookieStore.delete('rv_ops');
  return NextResponse.redirect(new URL('/ops', request.url));
}
