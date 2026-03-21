import 'server-only';

import { requireEnv } from '@/lib/env';

function baseUrl() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL || requireEnv('SUPABASE_URL')}/rest/v1`;
}

function serviceHeaders(extra = {}) {
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function serviceFetch(path, init = {}) {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: serviceHeaders(init.headers || {}),
    cache: 'no-store'
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Service request failed: ${response.status} ${text}`);
  }

  return response;
}

export async function selectRows(table, params = {}) {
  const search = new URLSearchParams(params);
  const response = await serviceFetch(`/${table}?${search.toString()}`);
  return response.json();
}

export async function selectOne(table, params = {}) {
  const rows = await selectRows(table, { ...params, limit: '1' });
  return rows[0] || null;
}

export async function insertRows(table, rows, prefer = 'return=representation') {
  const response = await serviceFetch(`/${table}`, {
    method: 'POST',
    headers: { Prefer: prefer },
    body: JSON.stringify(rows)
  });
  if (prefer.includes('return=minimal')) {
    return null;
  }
  return response.json();
}

export async function upsertRows(table, rows, onConflict, prefer = 'resolution=merge-duplicates,return=representation') {
  const response = await serviceFetch(`/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: 'POST',
    headers: { Prefer: prefer },
    body: JSON.stringify(rows)
  });
  if (prefer.includes('return=minimal')) {
    return null;
  }
  return response.json();
}

export async function deleteRows(table, params = {}) {
  const search = new URLSearchParams(params);
  const response = await serviceFetch(`/${table}?${search.toString()}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' }
  });
  return response.ok;
}

export async function countRows(table, params = {}) {
  const search = new URLSearchParams({ select: 'id', ...params });
  const response = await serviceFetch(`/${table}?${search.toString()}`, {
    method: 'HEAD',
    headers: { Prefer: 'count=exact' }
  });
  const contentRange = response.headers.get('content-range') || '*/0';
  return Number(contentRange.split('/')[1] || 0);
}
