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

const ACTIVE_SOURCE_SLUGS = ['reviewnote', 'revu', 'dinnerqueen', '4blog', 'seouloppa', 'gangnammatzip'];

const REGION_EQUIVALENTS = {
  서울: ['서울', '서울시', '강남', '강남구', '강동', '강동구', '강북', '강북구', '강서', '강서구', '관악', '관악구', '광진', '광진구', '구로', '구로구', '금천', '금천구', '노원', '노원구', '도봉', '도봉구', '동대문', '동대문구', '동작', '동작구', '마포', '마포구', '서대문', '서대문구', '서초', '서초구', '성동', '성동구', '성북', '성북구', '송파', '송파구', '양천', '양천구', '영등포', '영등포구', '용산', '용산구', '은평', '은평구', '종로', '종로구', '중', '중구', '중랑', '중랑구'],
  경기: ['경기', '경기도', '수원', '성남', '용인', '고양', '화성', '평택', '부천', '안산', '안양', '남양주', '파주', '김포', '의정부', '광주', '하남', '광명', '군포', '오산', '이천', '안성', '구리', '의왕', '포천', '양주', '동두천', '과천', '여주', '양평', '가평', '연천'],
  인천: ['인천', '인천시', '계양', '계양구', '미추홀', '미추홀구', '남동', '남동구', '동구', '부평', '부평구', '서구', '연수', '연수구', '중구', '강화', '강화군', '옹진', '옹진군'],
  부산: ['부산', '부산시', '강서구', '금정구', '기장', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대', '해운대구'],
  대구: ['대구', '대구시', '남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'],
  대전: ['대전', '대전시', '대덕구', '동구', '서구', '유성구', '중구'],
  광주: ['광주', '광주시', '광산구', '남구', '동구', '북구', '서구'],
  울산: ['울산', '울산시', '남구', '동구', '북구', '울주군', '중구'],
  세종: ['세종', '세종시', '세종특별자치시'],
  강원: ['강원', '강원도', '강원특별자치도', '춘천', '원주', '강릉', '동해', '태백', '속초', '삼척', '홍천', '횡성', '영월', '평창', '정선', '철원', '화천', '양구', '인제', '고성', '양양'],
  충북: ['충북', '충청북도', '청주', '충주', '제천', '보은', '옥천', '영동', '증평', '진천', '괴산', '음성', '단양'],
  충남: ['충남', '충청남도', '천안', '공주', '보령', '아산', '서산', '논산', '계룡', '당진', '금산', '부여', '서천', '청양', '홍성', '예산', '태안'],
  전북: ['전북', '전라북도', '전북특별자치도', '전주', '군산', '익산', '정읍', '남원', '김제', '완주', '진안', '무주', '장수', '임실', '순창', '고창', '부안'],
  전남: ['전남', '전라남도', '목포', '여수', '순천', '나주', '광양', '담양', '곡성', '구례', '고흥', '보성', '화순', '장흥', '강진', '해남', '영암', '무안', '함평', '영광', '장성', '완도', '진도', '신안'],
  경북: ['경북', '경상북도', '포항', '경주', '김천', '안동', '구미', '영주', '영천', '상주', '문경', '경산', '군위', '의성', '청송', '영양', '영덕', '청도', '고령', '성주', '칠곡', '예천', '봉화', '울진', '울릉'],
  경남: ['경남', '경상남도', '창원', '진주', '통영', '사천', '김해', '밀양', '거제', '양산', '의령', '함안', '창녕', '고성', '남해', '하동', '산청', '함양', '거창', '합천'],
  제주: ['제주', '제주도', '제주특별자치도', '제주시', '서귀포', '서귀포시']
};

function baseUrl() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL || requireEnv('SUPABASE_URL')}/rest/v1`;
}

function getKstToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function canonicalRegion(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  for (const [canonical, aliases] of Object.entries(REGION_EQUIVALENTS)) {
    if (aliases.includes(raw)) {
      return canonical;
    }
  }

  return null;
}

function isCanonicalAlias(value) {
  const raw = String(value || '').trim();
  const canonical = canonicalRegion(raw);
  if (!canonical) {
    return false;
  }
  return REGION_EQUIVALENTS[canonical].includes(raw) && raw !== canonical;
}

function buildRegionCondition(token) {
  return `or(region_primary_name.ilike.*${token}*,region_secondary_name.ilike.*${token}*)`;
}


function normalizeMultiValue(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean);
  }
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
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
  const { search, platform, type, source, region, regionPrimary, regionSecondary, deadline, trust, sort = 'deadline', limit = 24, offset = 0 } = searchParams;
  const platformValues = normalizeMultiValue(platform).filter((value) => value !== 'all');
  const typeValues = normalizeMultiValue(type).filter((value) => value !== 'all');
  const sourceValues = normalizeMultiValue(source).filter((value) => value !== 'all');
  const andConditions = [];

  params.set('select', CAMPAIGN_SELECT);
  params.set('status', 'eq.active');
  andConditions.push(`or(apply_deadline.is.null,apply_deadline.gte.${getKstToday()})`);
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
  if (regionPrimary && regionPrimary !== 'all') {
    if (regionSecondary && regionSecondary !== 'all') {
      andConditions.push(buildRegionCondition(regionSecondary));
    } else {
      const tokens = REGION_EQUIVALENTS[regionPrimary] || [regionPrimary];
      andConditions.push(`or(${tokens.flatMap((token) => [
        `region_primary_name.ilike.*${token}*`,
        `region_secondary_name.ilike.*${token}*`
      ]).join(',')})`);
    }
  } else if (region && region !== 'all') {
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
  const rows = await response.json();
  return attachExactLocations(rows);
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
  const [enriched] = await attachExactLocations(rows);
  return enriched || null;
});

export async function getCampaignExactLocation(id) {
  if (!id) {
    return null;
  }

  const params = new URLSearchParams({
    select: 'raw_payload',
    campaign_id: `eq.${id}`,
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
  const rows = await response.json();
  return attachExactLocations(rows);
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
  const enriched = await attachExactLocations(rows);
  return enriched.filter((row) => row.id !== campaign.id).slice(0, limit);
}

async function attachExactLocations(campaigns = []) {
  if (!Array.isArray(campaigns) || !campaigns.length) {
    return campaigns;
  }

  try {
    const locations = await getCampaignExactLocationsByIds(campaigns.map((campaign) => campaign.id));
    return campaigns.map((campaign) => ({
      ...campaign,
      exact_location: locations.get(campaign.id) || null
    }));
  } catch {
    return campaigns;
  }
}

async function getCampaignExactLocationsByIds(ids = []) {
  const filteredIds = [...new Set(ids.filter(Boolean))];
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
    if (typeof exactLocation === 'string' && exactLocation.trim()) {
      locations.set(campaignId, exactLocation.trim());
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
  params.set('or', `(apply_deadline.is.null,apply_deadline.gte.${getKstToday()})`);
  const response = await supabaseFetch(`/campaigns?${params.toString()}`);
  const rows = await response.json();
  const hierarchy = {};

  for (const row of rows) {
    const rawPrimary = String(row.region_primary_name || '').trim();
    const rawSecondary = String(row.region_secondary_name || '').trim();
    const primary = canonicalRegion(rawPrimary) || canonicalRegion(rawSecondary);
    if (!primary) {
      continue;
    }
    hierarchy[primary] ||= new Set();
    const normalizedSecondary =
      rawSecondary && !canonicalRegion(rawSecondary)
        ? rawSecondary
        : rawPrimary && rawPrimary !== primary && !isCanonicalAlias(rawPrimary)
          ? rawPrimary
          : null;
    if (normalizedSecondary) {
      hierarchy[primary].add(normalizedSecondary);
    }
  }

  return Object.fromEntries(
    Object.entries(hierarchy)
      .sort(([a], [b]) => a.localeCompare(b, 'ko'))
      .map(([primary, values]) => [primary, [...values].sort((a, b) => a.localeCompare(b, 'ko'))])
  );
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
  const today = getKstToday();
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
