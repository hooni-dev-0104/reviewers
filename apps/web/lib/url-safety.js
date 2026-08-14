const MAP_DETAIL_HOSTS = Object.freeze({
  '4blog': new Set(['4blog.net', 'www.4blog.net']),
  seouloppa: new Set(['seoulouba.co.kr', 'www.seoulouba.co.kr']),
  gangnammatzip: new Set(['gangnam-review.net', 'www.gangnam-review.net'])
});

function normalizeGangnamUrl(value) {
  return String(value || '')
    .replace('https://강남맛집.net', 'https://gangnam-review.net')
    .replace('https://xn--939au0g4vj8sq.net', 'https://gangnam-review.net');
}

export function normalizeAllowedMapDetailUrl(sourceSlug, originalUrl) {
  const allowedHosts = MAP_DETAIL_HOSTS[sourceSlug];
  if (!allowedHosts) {
    return null;
  }

  try {
    const candidate = new URL(
      sourceSlug === 'gangnammatzip' ? normalizeGangnamUrl(originalUrl) : String(originalUrl || '')
    );
    if (
      candidate.protocol !== 'https:' ||
      candidate.username ||
      candidate.password ||
      (candidate.port && candidate.port !== '443') ||
      !allowedHosts.has(candidate.hostname.toLowerCase())
    ) {
      return null;
    }
    return candidate.toString();
  } catch {
    return null;
  }
}

export const mapDetailHosts = Object.freeze(
  Object.fromEntries(Object.entries(MAP_DETAIL_HOSTS).map(([slug, hosts]) => [slug, [...hosts]]))
);
