import { cache } from 'react';

import { requireEnv } from '@/lib/env';

const CAMPAIGN_SELECT = [
  'id',
  'title',
  'platform_type',
  'campaign_type',
  'category_name',
  'subcategory_name',
  'region_primary_name',
  'region_secondary_name',
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

const ACTIVE_SOURCE_SLUGS = ['reviewnote', 'revu', 'dinnerqueen', '4blog'];

function baseUrl() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL || requireEnv('SUPABASE_URL')}/rest/v1`;
}

function publicHeaders() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || requireEnv('SUPABASE_SERVICE_ROLE_KEY');
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
  const { search, platform, type, source, region, deadline, trust, sort = 'deadline', limit = 24, offset = 0 } = searchParams;
  const andConditions = [];

  params.set('select', CAMPAIGN_SELECT);
  params.set('status', 'eq.active');
  if (!forCount) {
    params.set('limit', String(limit));
    params.set('offset', String(offset));
  }

  if (search) {
    const escaped = search.replaceAll(',', ' ');
    andConditions.push(
      `or(title.ilike.*${escaped}*,benefit_text.ilike.*${escaped}*,category_name.ilike.*${escaped}*,region_primary_name.ilike.*${escaped}*,region_secondary_name.ilike.*${escaped}*,snippet.ilike.*${escaped}*)`
    );
  }
  if (platform && platform !== 'all') {
    params.set('platform_type', `eq.${platform}`);
  }
  if (type && type !== 'all') {
    params.set('campaign_type', `eq.${type}`);
  }
  if (source && source !== 'all') {
    params.set('sources.slug', `eq.${source}`);
  }
  if (region && region !== 'all') {
    andConditions.push(`or(region_primary_name.ilike.*${region}*,region_secondary_name.ilike.*${region}*)`);
  }
  if (trust === 'stable') {
    params.set('requires_review', 'eq.false');
  }
  if (trust === 'review') {
    params.set('requires_review', 'eq.true');
  }
  if (deadline === 'today') {
    params.set('apply_deadline', `lte.${new Date().toISOString()}`);
  }
  if (deadline === '3days') {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    params.set('apply_deadline', `lte.${date.toISOString()}`);
  }
  if (deadline === '7days') {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    params.set('apply_deadline', `lte.${date.toISOString()}`);
  }

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
  return response.json();
});

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
  const params = new URLSearchParams({
    select: CAMPAIGN_SELECT,
    id: `eq.${id}`,
    limit: '1'
  });
  const response = await supabaseFetch(`/campaigns?${params.toString()}`);
  const rows = await response.json();
  return rows[0] || null;
});

export async function getCampaignsByIds(ids = []) {
  const filteredIds = ids.filter(Boolean);
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
  return response.json();
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
  return rows.filter((row) => row.id !== campaign.id).slice(0, limit);
}

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
  const response = await supabaseFetch('/campaigns?select=id&status=eq.active', {
    method: 'HEAD',
    headers: { Prefer: 'count=exact' }
  });
  return parseCountHeader(response.headers.get('content-range'));
}

export async function getVisitorCounts() {
  const today = new Date().toISOString().slice(0, 10);
  const [daily, total] = await Promise.all([
    countRows(`/site_daily_visitors?select=id&visit_date=eq.${today}`),
    countRows('/site_daily_visitors?select=id')
  ]);
  return { daily, total };
}

export async function recordVisitor({ visitorId, path }) {
  const today = new Date().toISOString().slice(0, 10);
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
