import 'server-only';

import { cache } from 'react';
import { kstDay as getKstToday, deadlineWindowEnd } from './dates.js';
import { regionConditions, regionHierarchy } from './regions.js';

import { requireEnv } from '@/lib/env';
import { requirePublicSupabaseKey } from '@/lib/env-safety';
import { sanitizeCampaignQuery, sanitizePostgrestText, sanitizeUuidList } from '@/lib/query-safety';

const CAMPAIGN_SELECT = [
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

const ACTIVE_SOURCE_SLUGS = ['reviewnote', 'reviewplace', 'revu', 'dinnerqueen', '4blog', 'seouloppa', 'ringble', 'gangnammatzip', 'chehumview', 'modan', 'nolowa'];

function baseUrl() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL || requireEnv('SUPABASE_URL')}/rest/v1`;
}

function normalizeMultiValue(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean);
  }
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function publicHeaders() {
  const key = requirePublicSupabaseKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json'
  };
}

function serviceHeaders() {
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json'
  };
}

async function supabaseFetch(path, init = {}, { service = false } = {}) {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      ...(service ? serviceHeaders() : publicHeaders()),
      ...(init.headers || {})
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${text}`);
  }

  return response;
}

function applyCampaignFilters(params, searchParams, { forCount = false } = {}) {
  const safeQuery = sanitizeCampaignQuery(searchParams, ACTIVE_SOURCE_SLUGS);
  const { search, region, regionPrimary, regionSecondary, deadline, trust, sort, limit, offset } = safeQuery;
  const platformValues = safeQuery.platform;
  const typeValues = safeQuery.type;
  const sourceValues = safeQuery.source;
  const andConditions = [];

  params.set('select', CAMPAIGN_SELECT);
  params.set('status', 'eq.active');
  andConditions.push(`or(apply_deadline.is.null,apply_deadline.gte.${new Date().toISOString()})`);
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
  const windowEnd = deadlineWindowEnd(deadline);
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

export const getCampaigns = cache(async function getCampaigns(searchParams = {}) {
  const params = new URLSearchParams();
  applyCampaignFilters(params, searchParams);
  const response = await supabaseFetch(`/campaigns?${params.toString()}`);
  const rows = await response.json();
  return attachLocationData(rows);
});

export async function getMapEligibleCampaigns(searchParams = {}) {
  const typeValues = normalizeMultiValue(searchParams.type).filter((value) => value !== 'all');
  if (typeValues.length && !typeValues.includes('visit')) {
    return [];
  }

  const params = new URLSearchParams();
  applyCampaignFilters(params, { ...searchParams, type: 'visit', limit: 240, offset: 0 });
  params.set('latitude', 'not.is.null');
  params.set('longitude', 'not.is.null');

  const response = await supabaseFetch(`/campaigns?${params.toString()}`);
  const rows = await response.json();
  const campaigns = await attachLocationData(rows);

  return campaigns.filter(
    (campaign) =>
      campaign.exact_location &&
      Number.isFinite(campaign.latitude) &&
      Number.isFinite(campaign.longitude)
  );
}

export async function getCampaignSearchCount(searchParams = {}) {
  const params = new URLSearchParams();
  applyCampaignFilters(params, searchParams, { forCount: true });
  const response = await supabaseFetch(`/campaigns?${params.toString()}`, {
    method: 'HEAD',
    headers: { Prefer: 'count=exact' }
  });
  return parseCountHeader(response.headers.get('content-range'));
}

export const getCampaignById = cache(async function getCampaignById(id) {
  const [safeId] = sanitizeUuidList([id], 1);
  if (!safeId) {
    return null;
  }
  const params = new URLSearchParams({
    select: CAMPAIGN_SELECT,
    id: `eq.${safeId}`,
    limit: '1'
  });
  const response = await supabaseFetch(`/campaigns?${params.toString()}`);
  const rows = await response.json();
  const [enriched] = await attachLocationData(rows);
  return enriched || null;
});

export async function getCampaignSnapshotRawPayload(id) {
  const [safeId] = sanitizeUuidList([id], 1);
  if (!safeId) {
    return null;
  }

  const params = new URLSearchParams({
    select: 'raw_payload',
    campaign_id: `eq.${safeId}`,
    order: 'crawled_at.desc',
    limit: '1'
  });
  const response = await supabaseFetch(`/campaign_snapshots?${params.toString()}`, {}, { service: true });
  const rows = await response.json();
  return rows[0]?.raw_payload || null;
}

export async function getCampaignExactLocation(id) {
  const [safeId] = sanitizeUuidList([id], 1);
  if (!safeId) {
    return null;
  }

  const params = new URLSearchParams({
    select: 'raw_payload',
    campaign_id: `eq.${safeId}`,
    order: 'crawled_at.desc',
    limit: '1'
  });
  const response = await supabaseFetch(`/campaign_snapshots?${params.toString()}`, {}, { service: true });
  const rows = await response.json();
  const rawPayload = rows[0]?.raw_payload;
  const exactLocation = rawPayload?.exact_location || rawPayload?.site_location || rawPayload?.address;
  return typeof exactLocation === 'string' ? exactLocation : null;
}

export async function getCampaignsByIds(ids = []) {
  const filteredIds = sanitizeUuidList(ids, 50);
  if (!filteredIds.length) {
    return [];
  }

  const params = new URLSearchParams({
    select: CAMPAIGN_SELECT,
    status: 'eq.active',
    id: `in.(${filteredIds.join(',')})`,
    order: 'apply_deadline.asc.nullslast,last_seen_at.desc',
    limit: String(Math.min(filteredIds.length, 50))
  });
  const response = await supabaseFetch(`/campaigns?${params.toString()}`);
  const rows = await response.json();
  return attachLocationData(rows);
}

export async function getRelatedCampaigns(campaign, limit = 4) {
  const params = new URLSearchParams({
    select: CAMPAIGN_SELECT,
    status: 'eq.active',
    limit: String(limit),
    order: 'apply_deadline.asc.nullslast,last_seen_at.desc'
  });

  if (campaign.sources?.slug) {
    params.set('sources.slug', `eq.${campaign.sources.slug}`);
  }

  if (campaign.region_primary_name) {
    params.set('region_primary_name', `eq.${campaign.region_primary_name}`);
  }

  const response = await supabaseFetch(`/campaigns?${params.toString()}`);
  const rows = await response.json();
  const enriched = await attachLocationData(rows);
  return enriched.filter((row) => row.id !== campaign.id).slice(0, limit);
}

async function attachLocationData(campaigns = []) {
  if (!Array.isArray(campaigns) || !campaigns.length) {
    return campaigns;
  }

  try {
    const missingIds = campaigns
      .filter((campaign) => !campaign.exact_location || campaign.latitude == null || campaign.longitude == null)
      .map((campaign) => campaign.id);
    const locations = missingIds.length ? await getCampaignLocationDataByIds(missingIds) : new Map();
    return campaigns.map((campaign) => ({
      ...campaign,
      exact_location: campaign.exact_location || locations.get(campaign.id)?.exact_location || null,
      latitude: campaign.latitude != null ? Number(campaign.latitude) : locations.get(campaign.id)?.latitude ?? null,
      longitude: campaign.longitude != null ? Number(campaign.longitude) : locations.get(campaign.id)?.longitude ?? null
    }));
  } catch {
    return campaigns;
  }
}

async function getCampaignLocationDataByIds(ids = []) {
  const filteredIds = sanitizeUuidList(ids, 240);
  if (!filteredIds.length) {
    return new Map();
  }

  const params = new URLSearchParams({
    select: 'campaign_id,raw_payload',
    campaign_id: `in.(${filteredIds.join(',')})`,
    order: 'campaign_id.asc,crawled_at.desc',
    limit: String(Math.max(filteredIds.length * 4, 50))
  });
  const response = await supabaseFetch(`/campaign_snapshots?${params.toString()}`, {}, { service: true });
  const rows = await response.json();
  const locations = new Map();

  for (const row of rows) {
    const campaignId = row?.campaign_id;
    if (!campaignId || locations.has(campaignId)) {
      continue;
    }
    const exactLocation = row?.raw_payload?.exact_location || row?.raw_payload?.site_location || row?.raw_payload?.address;
    const latitude = row?.raw_payload?.latitude;
    const longitude = row?.raw_payload?.longitude;
    if ((typeof exactLocation === 'string' && exactLocation.trim()) || (latitude != null && longitude != null)) {
      locations.set(campaignId, {
        exact_location: typeof exactLocation === 'string' ? exactLocation.trim() : null,
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null
      });
    }
  }

  return locations;
}


export const getRegionHierarchy = cache(async function getRegionHierarchy() {
  const params = new URLSearchParams({
    select: 'region_primary_name,region_secondary_name',
    status: 'eq.active',
    order: 'region_primary_name.asc,region_secondary_name.asc',
    limit: '5000'
  });
  params.set('or', `(apply_deadline.is.null,apply_deadline.gte.${new Date().toISOString()})`);
  const response = await supabaseFetch(`/campaigns?${params.toString()}`);
  const rows = await response.json();
  return regionHierarchy(rows);
});

export const getSources = cache(async function getSources() {
  const params = new URLSearchParams({
    select: 'slug,name,platform_type',
    is_active: 'eq.true',
    slug: `in.(${ACTIVE_SOURCE_SLUGS.join(',')})`,
    order: 'priority.asc'
  });
  const response = await supabaseFetch(`/sources?${params.toString()}`);
  return response.json();
});

export async function getCampaignCount() {
  const today = new Date().toISOString();
  const response = await supabaseFetch(`/campaigns?select=id&status=eq.active&or=(apply_deadline.is.null,apply_deadline.gte.${today})`, {
    method: 'HEAD',
    headers: { Prefer: 'count=exact' }
  });
  return parseCountHeader(response.headers.get('content-range'));
}

export async function getVisitorCounts() {
  const today = getKstToday();
  const [daily, total] = await Promise.all([
    countRows(`/site_daily_visitors?select=id&visit_date=eq.${today}`),
    countRows('/site_daily_visitors?select=id')
  ]);
  return { daily, total };
}

export async function recordVisitor({ visitorId, path }) {
  const today = getKstToday();
  await supabaseFetch('/site_daily_visitors', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify([{ visitor_id: visitorId, visit_date: today, path }])
  }, { service: true });

  return getVisitorCounts();
}

async function countRows(path) {
  const response = await supabaseFetch(path, {
    method: 'HEAD',
    headers: { Prefer: 'count=exact' }
  }, { service: true });
  return parseCountHeader(response.headers.get('content-range'));
}

function parseCountHeader(value) {
  if (!value) {
    return 0;
  }
  const parts = value.split('/');
  return Number(parts[1] || 0);
}
