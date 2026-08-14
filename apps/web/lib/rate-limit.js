import 'server-only';

import { NextResponse } from 'next/server';

import { rpc } from '@/lib/server-data';
import { buildRateLimitKey, getClientIp, RATE_LIMIT_POLICIES } from '@/lib/rate-limit-policy';

function rateLimitIdentity(request, scope, identifier) {
  return buildRateLimitKey(scope, getClientIp(request), identifier);
}

export async function consumeRateLimit(request, scope, identifier = '') {
  const policy = RATE_LIMIT_POLICIES[scope];
  if (!policy) {
    throw new Error(`Unknown rate-limit scope: ${scope}`);
  }
  const keyHash = rateLimitIdentity(request, scope, identifier);
  const rows = await rpc('consume_security_rate_limit', {
    p_scope: scope,
    p_key_hash: keyHash,
    p_limit: policy.limit,
    p_window_seconds: policy.windowSeconds,
    p_block_seconds: policy.blockSeconds
  });
  const result = Array.isArray(rows) ? rows[0] : rows;
  return {
    allowed: Boolean(result?.allowed),
    retryAfter: Math.max(1, Number(result?.retry_after_seconds || policy.windowSeconds)),
    keyHash
  };
}

export async function clearRateLimit(scope, keyHash) {
  if (!keyHash) {
    return;
  }
  await rpc('clear_security_rate_limit', { p_scope: scope, p_key_hash: keyHash });
}

export function rateLimitResponse(retryAfter) {
  return NextResponse.json(
    { error: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.' },
    { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil(retryAfter))) } }
  );
}
