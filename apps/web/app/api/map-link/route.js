import { NextResponse } from 'next/server';

import { getCampaignById, getCampaignExactLocation } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const provider = searchParams.get('provider');

  if (!id || !provider || !['kakao', 'naver'].includes(provider)) {
    return NextResponse.redirect(new URL('/', request.url), { status: 302 });
  }

  const campaign = await getCampaignById(id);
  if (!campaign) {
    return NextResponse.redirect(new URL('/', request.url), { status: 302 });
  }

  const storedExactLocation = await getCampaignExactLocation(id);
  const exactLocation = storedExactLocation || await resolveExactLocation(campaign);
  const query = normalizePreciseLocation(exactLocation);
  const target = query ? buildProviderSearchUrl(provider, query) : null;

  if (!target) {
    return NextResponse.redirect(campaign.original_url, { status: 302 });
  }

  return NextResponse.redirect(target, { status: 302 });
}

function buildProviderSearchUrl(provider, query) {
  if (provider === 'kakao') {
    return `https://map.kakao.com/link/search/${encodeURIComponent(query)}`;
  }
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

async function resolveExactLocation(campaign) {
  const sourceSlug = campaign.sources?.slug;

  if (!sourceSlug || !campaign.original_url) {
    return null;
  }

  try {
    const detailUrl = normalizeDetailUrl(sourceSlug, campaign.original_url);
    const response = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ReviewKokMapResolver/1.0; +https://reviewkok.vercel.app)'
      },
      next: { revalidate: 60 * 60 * 6 },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    return extractExactLocationFromHtml(sourceSlug, html);
  } catch {
    return null;
  }
}

function normalizeDetailUrl(sourceSlug, originalUrl) {
  if (sourceSlug === 'gangnammatzip') {
    return originalUrl
      .replace('https://강남맛집.net', 'https://gangnam-review.net')
      .replace('https://xn--939au0g4vj8sq.net', 'https://gangnam-review.net');
  }
  return originalUrl;
}

function extractExactLocationFromHtml(sourceSlug, html) {
  if (!html) {
    return null;
  }

  if (sourceSlug === 'seouloppa') {
    return cleanLocation(matchFirst(html, /addressSearch\('([^']+)'/));
  }

  if (sourceSlug === 'gangnammatzip') {
    return cleanLocation(matchFirst(html, /var\s+loca\s*=\s*"([^"]+)"/));
  }

  if (sourceSlug === '4blog') {
    return cleanLocation(matchFirst(html, /체험\s*장소.*?(?:<\/div>|<\/strong>|<\/dt>)\s*([^<]+)/s))
      || cleanLocation(matchFirst(html, /체험\s*장소.*?<p[^>]*>(.*?)<\/p>/s));
  }

  return null;
}

function matchFirst(html, pattern) {
  const match = html.match(pattern);
  return match?.[1] || null;
}

function cleanLocation(value) {
  const compact = String(value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!compact || compact.length < 4) {
    return null;
  }

  return compact;
}

function normalizePreciseLocation(value) {
  const compact = cleanLocation(value);
  if (!compact) {
    return null;
  }

  let normalized = compact
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\)/g, ')')
    .trim();

  normalized = normalized.replace(/(\d+층)\s+[^\s]+$/, '$1');
  normalized = normalized.replace(/(\d+호)\s+[^\s]+$/, '$1');

  return normalized;
}
