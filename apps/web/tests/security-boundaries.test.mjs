import assert from 'node:assert/strict';
import test from 'node:test';

import { requirePublicSupabaseKey } from '../lib/env-safety.js';
import { campaignQueryAllowlist, sanitizeCampaignQuery, sanitizePostgrestText, sanitizeUuidList } from '../lib/query-safety.js';
import { buildRateLimitKey, consumeInMemoryRateLimit, getClientIp, RATE_LIMIT_POLICIES } from '../lib/rate-limit-policy.js';
import { normalizeAllowedMapDetailUrl } from '../lib/url-safety.js';

test('public Supabase requests fail closed without an anon key', () => {
  assert.throws(
    () => requirePublicSupabaseKey({ SUPABASE_SERVICE_ROLE_KEY: 'service-secret' }),
    /NEXT_PUBLIC_SUPABASE_ANON_KEY/
  );
  assert.equal(requirePublicSupabaseKey({ NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key' }), 'anon-key');
});

test('PostgREST free text strips structured filter syntax', () => {
  assert.equal(sanitizePostgrestText('강남*),or(status.eq.hidden'), '강남 or status.eq.hidden');
  const query = sanitizeCampaignQuery(
    {
      platform: 'blog,admin',
      type: 'visit,unknown',
      source: 'reviewnote,private_table',
      deadline: 'tomorrow',
      trust: 'anything',
      sort: 'raw_sql',
      limit: '9999',
      offset: '-20'
    },
    ['reviewnote']
  );
  assert.deepEqual(query.platform, ['blog']);
  assert.deepEqual(query.type, ['visit']);
  assert.deepEqual(query.source, ['reviewnote']);
  assert.equal(query.deadline, 'all');
  assert.equal(query.trust, 'all');
  assert.equal(query.sort, 'deadline');
  assert.equal(query.limit, 240);
  assert.equal(query.offset, 0);
  assert.ok(campaignQueryAllowlist.platforms.includes('mixed'));
  assert.deepEqual(
    sanitizeUuidList(['550e8400-e29b-41d4-a716-446655440000', '1),status.eq.hidden']),
    ['550e8400-e29b-41d4-a716-446655440000']
  );
});

test('map resolver only accepts exact HTTPS source hosts', () => {
  assert.equal(
    normalizeAllowedMapDetailUrl('4blog', 'https://4blog.net/campaign/1'),
    'https://4blog.net/campaign/1'
  );
  assert.equal(normalizeAllowedMapDetailUrl('4blog', 'http://4blog.net/campaign/1'), null);
  assert.equal(normalizeAllowedMapDetailUrl('4blog', 'https://4blog.net.evil.test/campaign/1'), null);
  assert.equal(normalizeAllowedMapDetailUrl('4blog', 'https://127.0.0.1/private'), null);
  assert.equal(normalizeAllowedMapDetailUrl('reviewnote', 'https://www.reviewnote.co.kr/campaign/1'), null);
  assert.equal(
    normalizeAllowedMapDetailUrl('gangnammatzip', 'https://강남맛집.net/detail.php?id=1'),
    'https://gangnam-review.net/detail.php?id=1'
  );
});

test('rate-limit keys are scoped hashes and client IP uses the trusted forwarding slot', () => {
  const request = { headers: new Headers({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }) };
  assert.equal(getClientIp(request), '203.0.113.9');
  const key = buildRateLimitKey('login', getClientIp(request), 'USER@example.com');
  assert.match(key, /^[a-f0-9]{64}$/);
  assert.equal(key, buildRateLimitKey('login', '203.0.113.9', 'user@example.com'));
  assert.notEqual(key, buildRateLimitKey('ops', '203.0.113.9', 'user@example.com'));
  assert.deepEqual(RATE_LIMIT_POLICIES.login, {
    limit: 5,
    windowSeconds: 900,
    blockSeconds: 900
  });
  assert.equal(RATE_LIMIT_POLICIES.unlock.limit, 10);
});

test('in-memory fallback keeps auth available while the database migration is pending', () => {
  const buckets = new Map();
  const policy = { limit: 2, windowSeconds: 60, blockSeconds: 120 };
  assert.equal(consumeInMemoryRateLimit(buckets, 'login:key', policy, 1000).allowed, true);
  assert.equal(consumeInMemoryRateLimit(buckets, 'login:key', policy, 2000).allowed, true);
  const blocked = consumeInMemoryRateLimit(buckets, 'login:key', policy, 3000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfter, 120);
  assert.equal(consumeInMemoryRateLimit(buckets, 'login:key', policy, 61001).allowed, false);
  assert.equal(consumeInMemoryRateLimit(buckets, 'login:key', policy, 123001).allowed, true);
});
