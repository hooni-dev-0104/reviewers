import crypto from 'node:crypto';

export const RATE_LIMIT_POLICIES = Object.freeze({
  login: Object.freeze({ limit: 5, windowSeconds: 15 * 60, blockSeconds: 15 * 60 }),
  signup: Object.freeze({ limit: 5, windowSeconds: 60 * 60, blockSeconds: 60 * 60 }),
  ops: Object.freeze({ limit: 5, windowSeconds: 15 * 60, blockSeconds: 30 * 60 }),
  unlock: Object.freeze({ limit: 10, windowSeconds: 15 * 60, blockSeconds: 30 * 60 })
});

export function getClientIp(request) {
  const forwarded = request?.headers?.get?.('x-forwarded-for');
  const candidate = String(forwarded || request?.headers?.get?.('x-real-ip') || 'unknown')
    .split(',')[0]
    .trim();
  return candidate.slice(0, 96) || 'unknown';
}

export function buildRateLimitKey(scope, ip, identifier = '') {
  if (!RATE_LIMIT_POLICIES[scope]) {
    throw new Error(`Unknown rate-limit scope: ${scope}`);
  }
  return crypto
    .createHash('sha256')
    .update(`${scope}\0${String(ip || 'unknown')}\0${String(identifier || '').trim().toLowerCase()}`)
    .digest('hex');
}

export function consumeInMemoryRateLimit(store, key, policy, now = Date.now()) {
  let bucket = store.get(key);
  if (bucket?.blockedUntil > now) {
    store.set(key, bucket);
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((bucket.blockedUntil - now) / 1000)) };
  }
  if (!bucket || bucket.windowStartedAt + policy.windowSeconds * 1000 <= now) {
    bucket = { windowStartedAt: now, attemptCount: 0, blockedUntil: 0 };
  }
  bucket.attemptCount += 1;
  if (bucket.attemptCount > policy.limit) {
    bucket.blockedUntil = now + policy.blockSeconds * 1000;
  }
  store.set(key, bucket);
  return {
    allowed: bucket.blockedUntil === 0,
    retryAfter: bucket.blockedUntil
      ? policy.blockSeconds
      : Math.max(1, Math.ceil((bucket.windowStartedAt + policy.windowSeconds * 1000 - now) / 1000))
  };
}
