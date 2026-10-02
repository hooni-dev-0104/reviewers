import { sanitizeUuidList } from './query-safety.js';
export const EVENT_KINDS = ['sponsor_impression', 'sponsor_click', 'campaign_outbound_click'];
export function privacyOptOut(headers) {
  return headers.get('dnt') === '1' || headers.get('sec-gpc') === '1';
}
export function validEvent(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (Object.keys(value).some(key => !['event', 'entityId', 'slot'].includes(key))) return null;
  if (!EVENT_KINDS.includes(value.event) || !sanitizeUuidList([value.entityId]).length) return null;
  const slot = value.event === 'campaign_outbound_click' ? 'campaign-detail' : 'feed-inline';
  return value.slot === slot ? { event: value.event, entityId: value.entityId, slot } : null;
}
async function smallJson(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('content');
  if (Number(request.headers.get('content-length')) > 1024) throw new Error('size');
  if (!request.body) throw new Error('empty');
  const reader = request.body.getReader();
  let size = 0, text = '';
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1024) { await reader.cancel(); throw new Error('size'); }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally { reader.releaseLock(); }
}
export function createEventHandler({ enabled, origin, limit, record }) {
  return async function POST(request) {
    const empty = status => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });
    if (!enabled || privacyOptOut(request.headers)) return empty(204);
    if (request.headers.get('origin') !== origin || (request.headers.get('sec-fetch-site') && request.headers.get('sec-fetch-site') !== 'same-origin')) return empty(403);
    if (!limit(request)) return empty(429);
    let event;
    try { event = validEvent(await smallJson(request)); } catch { return empty(400); }
    if (!event) return empty(400);
    try { return empty(await record(event) ? 204 : 400); } catch { return empty(503); }
  };
}
