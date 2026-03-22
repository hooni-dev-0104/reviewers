import { NextResponse } from 'next/server';

const ALLOWED_HOSTS = new Set([
  'dq-files.gcdn.ntruss.com',
  'files.weble.net',
  '4blog.net',
  'www.4blog.net'
]);

export async function GET(request) {
  const src = request.nextUrl.searchParams.get('src');
  if (!src) {
    return NextResponse.json({ error: 'src is required' }, { status: 400 });
  }

  let url;
  try {
    url = new URL(src);
  } catch (_error) {
    return NextResponse.json({ error: 'invalid src' }, { status: 400 });
  }

  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    return NextResponse.json({ error: 'host not allowed' }, { status: 400 });
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 Reviewkok Image Proxy'
    },
    cache: 'force-cache'
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'image fetch failed' }, { status: 502 });
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400'
    }
  });
}
