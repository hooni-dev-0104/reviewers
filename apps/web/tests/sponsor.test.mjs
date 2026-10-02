import test from 'node:test';
import assert from 'node:assert/strict';
import { pickSponsor, safeExternalUrl, sponsorStatus } from '../lib/sponsor-policy.js';
const now = Date.parse('2026-10-02T00:00:00Z');
const valid = { id: 'b', slot_key: 'feed-inline', is_active: true, priority: 1, cta_url: 'https://example.com', starts_at: '2026-10-01T00:00:00Z', ends_at: '2026-10-03T00:00:00Z' };
test('ads require a valid finite interval and URL; boundaries and ties are deterministic', () => {
  assert.equal(pickSponsor([valid, { ...valid, id: 'a' }], 'feed-inline', now).id, 'a');
  assert.equal(sponsorStatus(valid, Date.parse(valid.starts_at)), '활성');
  assert.equal(sponsorStatus(valid, Date.parse(valid.ends_at)), '종료');
  for (const update of [{ ends_at: null }, { starts_at: null }, { ends_at: valid.starts_at }, { cta_url: 'javascript:alert(1)' }, { is_active: false }]) assert.equal(pickSponsor([{ ...valid, ...update }], 'feed-inline', now), null);
  assert.equal(pickSponsor([], 'feed-inline', now), null);
  for (const url of ['javascript:alert(1)', 'data:text/html,bad', 'https://user:pass@example.com', '/relative']) assert.equal(safeExternalUrl(url), null);
  assert.equal(safeExternalUrl('https://example.com'), 'https://example.com/');
});
