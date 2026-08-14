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
