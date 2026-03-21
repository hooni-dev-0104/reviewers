import 'server-only';

import { selectOne } from '@/lib/server-data';

export async function getActiveSponsor(slotKey = 'feed-inline') {
  const now = new Date().toISOString();
  return selectOne('sponsor_slots', {
    select: 'id,slot_key,title,body,cta_label,cta_url',
    slot_key: `eq.${slotKey}`,
    is_active: 'eq.true',
    or: `(starts_at.is.null,starts_at.lte.${now})`,
    order: 'priority.asc'
  });
}
