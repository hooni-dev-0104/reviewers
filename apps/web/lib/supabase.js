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

function applyCampaignFilters(params, searchParams) {
  const { search, platform, type, source, region, deadline, trust, limit = 48 } = searchParams;
  const andConditions = [];

  params.set('select', CAMPAIGN_SELECT);
  params.set('status', 'in.(active,expired)');
  params.set('order', 'apply_deadline.asc.nullslast,last_seen_at.desc');
  params.set('limit', String(limit));

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
    params.set('or', andConditions[0].slice(3, -1));
  }

  if (andConditions.length > 1) {
    params.set('and', `(${andConditions.join(',')})`);
  }
}

export const getCampaigns = cache(async function getCampaigns(searchParams = {}) {
  const params = new URLSearchParams();
  applyCampaignFilters(params, searchParams);
  const response = await supabaseFetch(`/campaigns?${params.toString()}`);
  return response.json();
});

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

export const getSources = cache(async function getSources() {
  const params = new URLSearchParams({
    select: 'slug,name,platform_type',
    is_active: 'eq.true',
    order: 'priority.asc'
  });
  const response = await supabaseFetch(`/sources?${params.toString()}`);
  return response.json();
});

export async function getCampaignCount() {
  const response = await supabaseFetch('/campaigns?select=id&status=in.(active,expired)', {
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
