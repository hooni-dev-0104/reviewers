import test from 'node:test';
import assert from 'node:assert/strict';
import { createEventHandler, validEvent } from '../lib/event-policy.js';
import { eventRateLimit } from '../lib/event-rate-limit.js';
const entityId = '11111111-1111-4111-8111-111111111111';
const payload = { event: 'sponsor_click', entityId, slot: 'feed-inline' };
function request(body = payload, headers = {}) {
  return new Request('https://example.com/api/events', { method: 'POST', headers: { origin: 'https://example.com', 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
}
test('event API rejects invalid payloads, origins, oversized bodies and opt-outs', async () => {
  let count = 0;
  const handler = createEventHandler({ enabled: true, origin: 'https://example.com', limit: () => true, record: async () => { count++; return true; } });
  assert.equal((await handler(request())).status, 204);
  for (const body of [{ ...payload, entityId: 'bad' }, { ...payload, event: 'purchase' }, { ...payload, slot: 'detail' }, { ...payload, url: 'https://example.com' }, { extra: 'x'.repeat(2000) }]) assert.equal((await handler(request(body))).status, 400);
  assert.equal((await handler(request(payload, { origin: 'https://evil.com' }))).status, 403);
  for (const header of ['dnt', 'sec-gpc']) assert.equal((await handler(request(payload, { [header]: '1' }))).status, 204);
  assert.equal(count, 1);
  assert.equal(validEvent({ ...payload, event: 'campaign_outbound_click', slot: 'campaign-detail' }).slot, 'campaign-detail');
});
test('disabled, rate-limited, nonexistent and DB-error states never count', async () => {
  const base = { enabled: true, origin: 'https://example.com', limit: () => true, record: async () => false };
  assert.equal((await createEventHandler(base)(request())).status, 400);
  assert.equal((await createEventHandler({ ...base, enabled: false })(request())).status, 204);
  assert.equal((await createEventHandler({ ...base, limit: () => false })(request())).status, 429);
  assert.equal((await createEventHandler({ ...base, record: async () => { throw Error('DB'); } })(request())).status, 503);
  const req = request(payload, { 'x-forwarded-for': '192.0.2.1' });
  for (let i = 0; i < 60; i++) assert.equal(eventRateLimit(req, 1000), true);
  assert.equal(eventRateLimit(req, 1000), false);
  assert.equal(eventRateLimit(req, 62000), true);
});

test('streamed payload limit is enforced without content-length', async () => {
  const handler = createEventHandler({ enabled: true, origin: 'https://example.com', limit: () => true, record: async () => { throw Error('must not reach'); } });
  const stream = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('x'.repeat(1025))); c.close(); } });
  const req = new Request('https://example.com/api/events', { method: 'POST', headers: { origin: 'https://example.com', 'content-type': 'application/json' }, body: stream, duplex: 'half' });
  assert.equal((await handler(req)).status, 400);
});
