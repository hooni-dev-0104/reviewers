import 'server-only';
import { selectRows } from '@/lib/server-data';
import { pickSponsor, SPONSOR_SLOTS } from './sponsor-policy.js';

export async function getActiveSponsor(slotKey = 'feed-inline') {
  if (process.env.SPONSOR_SLOTS_ENABLED !== 'true' || !SPONSOR_SLOTS.includes(slotKey)) return null;
  const now = new Date().toISOString();
  try {
    for (let offset = 0; ; offset += 100) {
      const rows = await selectRows('sponsor_slots', {
        select: 'id,slot_key,title,body,cta_label,cta_url,is_active,priority,starts_at,ends_at',
        slot_key: `eq.${slotKey}`, is_active: 'eq.true', starts_at: `lte.${now}`, ends_at: `gt.${now}`,
        order: 'priority.asc,id.asc', limit: '100', offset: String(offset)
      });
      const sponsor = pickSponsor(rows, slotKey, Date.parse(now));
      if (sponsor) return { ...sponsor, measurementEnabled: process.env.AD_EVENTS_ENABLED === 'true' };
      if (rows.length < 100) return null;
    }
  } catch { return null; }
}
