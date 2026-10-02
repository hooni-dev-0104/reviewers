import { createEventHandler } from '@/lib/event-policy';
import { eventRateLimit } from '@/lib/event-rate-limit';
import { rpc, selectOne } from '@/lib/server-data';
import { sponsorStatus } from '@/lib/sponsor-policy';

export async function POST(request) {
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url).origin;
  return createEventHandler({
    enabled: process.env.AD_EVENTS_ENABLED === 'true', origin, limit: eventRateLimit,
    record: async ({ event, entityId, slot }) => {
      if (event.startsWith('sponsor_')) {
        if (process.env.SPONSOR_SLOTS_ENABLED !== 'true') return false;
        const sponsor = await selectOne('sponsor_slots', { id: `eq.${entityId}`, select: 'id,slot_key,is_active,starts_at,ends_at,cta_url' });
        if (sponsorStatus(sponsor) !== '활성' || sponsor.slot_key !== slot) return false;
      }
      return await rpc('record_public_event', { p_event: event, p_entity_id: entityId, p_slot: slot }) === true;
    }
  })(request);
}
