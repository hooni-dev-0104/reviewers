import { getCampaigns } from '@/lib/supabase';

const DEFAULT_SOURCE_ORDER = ['revu', 'reviewnote', 'dinnerqueen', '4blog'];

export function isDefaultBrowse(searchParams = {}) {
  const entries = Object.entries(searchParams || {}).filter(([, value]) => value !== undefined && value !== '');
  if (!entries.length) {
    return true;
  }

  return entries.every(([key, value]) => {
    if (key === 'sort') {
      return value === 'deadline';
    }
    return value === 'all';
  });
}

export async function getBalancedHomepageCampaigns({ offset = 0, limit = 24 } = {}) {
  const perSourceLimit = Math.max(offset + limit, limit);
  const perSource = await Promise.all(
    DEFAULT_SOURCE_ORDER.map((source) => getCampaigns({ source, sort: 'deadline', limit: perSourceLimit, offset: 0 }))
  );

  const merged = [];
  const seen = new Set();
  const maxLength = Math.max(...perSource.map((items) => items.length), 0);

  for (let index = 0; index < maxLength; index += 1) {
    for (const group of perSource) {
      const item = group[index];
      if (!item || seen.has(item.id)) {
        continue;
      }
      merged.push(item);
      seen.add(item.id);
    }
  }

  return merged.slice(offset, offset + limit);
}
