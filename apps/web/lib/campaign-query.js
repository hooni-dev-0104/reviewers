import { sanitizeCampaignQuery } from './query-safety.js';
import { deadlineWindowEnd } from './dates.js';
import { regionConditions } from './regions.js';

export const CAMPAIGN_SELECT = [
  'id',
  'title',
  'platform_type',
  'campaign_type',
  'category_name',
  'subcategory_name',
  'region_primary_name',
  'region_secondary_name',
  'exact_location',
  'latitude',
  'longitude',
  'benefit_text',
  'recruit_count',
  'apply_deadline',
  'thumbnail_url',
  'snippet',
  'status',
  'requires_review',
  'original_url',
  'last_seen_at',
  'sources!inner(name,slug)'
].join(',');

export const ACTIVE_SOURCE_SLUGS = ['reviewnote', 'reviewplace', 'revu', 'dinnerqueen', '4blog', 'seouloppa', 'ringble', 'gangnammatzip', 'chehumview', 'modan', 'nolowa'];

export function applyCampaignFilters(params, searchParams, { forCount = false, now = Date.now() } = {}) {
  const safeQuery = sanitizeCampaignQuery(searchParams, ACTIVE_SOURCE_SLUGS);
  const { search, region, regionPrimary, regionSecondary, deadline, trust, sort, limit, offset } = safeQuery;
  const platformValues = safeQuery.platform;
  const typeValues = safeQuery.type;
  const sourceValues = safeQuery.source;
  const andConditions = [];

  params.set('select', CAMPAIGN_SELECT);
  params.set('status', 'eq.active');
  andConditions.push(`or(apply_deadline.is.null,apply_deadline.gte.${new Date(now).toISOString()})`);
  if (!forCount) {
    params.set('limit', String(limit));
    params.set('offset', String(offset));
  }

  if (search) {
    andConditions.push(
      `or(title.ilike.*${search}*,benefit_text.ilike.*${search}*,category_name.ilike.*${search}*,region_primary_name.ilike.*${search}*,region_secondary_name.ilike.*${search}*,snippet.ilike.*${search}*)`
    );
  }
  if (platformValues.length === 1) {
    params.set('platform_type', `eq.${platformValues[0]}`);
  } else if (platformValues.length > 1) {
    params.set('platform_type', `in.(${platformValues.join(',')})`);
  }
  if (typeValues.length === 1) {
    params.set('campaign_type', `eq.${typeValues[0]}`);
  } else if (typeValues.length > 1) {
    params.set('campaign_type', `in.(${typeValues.join(',')})`);
  }
  if (sourceValues.length === 1) {
    params.set('sources.slug', `eq.${sourceValues[0]}`);
  } else if (sourceValues.length > 1) {
    params.set('sources.slug', `in.(${sourceValues.join(',')})`);
  }
  andConditions.push(...regionConditions({ regionPrimary, regionSecondary, region }));
  if (trust === 'stable') {
    params.set('requires_review', 'eq.false');
  }
  if (trust === 'review') {
    params.set('requires_review', 'eq.true');
  }
  const windowEnd = deadlineWindowEnd(deadline, now);
  if (windowEnd) params.set('apply_deadline', `lt.${windowEnd}`);

  if (andConditions.length === 1) {
    params.set('or', andConditions[0].slice(2));
  }

  if (andConditions.length > 1) {
    params.set('and', `(${andConditions.join(',')})`);
  }

  const orderValue = {
    newest: 'last_seen_at.desc,apply_deadline.asc.nullslast',
    slots: 'recruit_count.desc.nullslast,apply_deadline.asc.nullslast',
    trusted: 'requires_review.asc,apply_deadline.asc.nullslast,last_seen_at.desc',
    deadline: 'apply_deadline.asc.nullslast,last_seen_at.desc'
  }[sort] || 'apply_deadline.asc.nullslast,last_seen_at.desc';

  params.set('order', orderValue);
}

