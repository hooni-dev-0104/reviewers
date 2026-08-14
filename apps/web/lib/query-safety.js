const PLATFORM_VALUES = new Set(['blog', 'instagram', 'youtube', 'tiktok', 'mixed', 'etc']);
const CAMPAIGN_TYPE_VALUES = new Set(['visit', 'delivery', 'purchase', 'content', 'mixed', 'etc']);
const DEADLINE_VALUES = new Set(['all', 'today', '3days', '7days']);
const TRUST_VALUES = new Set(['all', 'stable', 'review']);
const SORT_VALUES = new Set(['deadline', 'newest', 'slots', 'trusted']);

export function sanitizePostgrestText(value, maxLength = 80) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s._-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function allowlistedValues(value, allowedValues) {
  const values = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(values.map((item) => String(item).trim()).filter((item) => allowedValues.has(item)))];
}

export function sanitizeUuidList(values, limit = 50) {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return [...new Set((Array.isArray(values) ? values : [values])
    .map((value) => String(value || '').trim())
    .filter((value) => uuidPattern.test(value)))]
    .slice(0, limit);
}

export function sanitizeCampaignQuery(input, activeSourceSlugs) {
  const sourceValues = new Set(activeSourceSlugs);
  const numberOr = (value, fallback, min, max) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), min), max) : fallback;
  };

  return {
    search: sanitizePostgrestText(input.search),
    platform: allowlistedValues(input.platform, PLATFORM_VALUES),
    type: allowlistedValues(input.type, CAMPAIGN_TYPE_VALUES),
    source: allowlistedValues(input.source, sourceValues),
    region: sanitizePostgrestText(input.region, 40),
    regionPrimary: sanitizePostgrestText(input.regionPrimary, 24),
    regionSecondary: sanitizePostgrestText(input.regionSecondary, 40),
    deadline: DEADLINE_VALUES.has(input.deadline) ? input.deadline : 'all',
    trust: TRUST_VALUES.has(input.trust) ? input.trust : 'all',
    sort: SORT_VALUES.has(input.sort) ? input.sort : 'deadline',
    limit: numberOr(input.limit, 24, 1, 240),
    offset: numberOr(input.offset, 0, 0, 10000)
  };
}

export const campaignQueryAllowlist = Object.freeze({
  platforms: [...PLATFORM_VALUES],
  types: [...CAMPAIGN_TYPE_VALUES],
  deadlines: [...DEADLINE_VALUES],
  trust: [...TRUST_VALUES],
  sorts: [...SORT_VALUES]
});
