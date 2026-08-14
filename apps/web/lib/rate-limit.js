import 'server-only';

import { NextResponse } from 'next/server';

import { rpc } from '@/lib/server-data';
import { buildRateLimitKey, consumeInMemoryRateLimit, getClientIp, RATE_LIMIT_POLICIES } from '@/lib/rate-limit-policy';

const fallbackBuckets = globalThis.__reviewKokRateLimitBuckets || new Map();
globalThis.__reviewKokRateLimitBuckets = fallbackBuckets;

function isMissingRateLimitRpc(error) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /consume_security_rate_limit|clear_security_rate_limit|PGRST202|schema cache/i.test(message);
}

function rateLimitIdentity(request, scope, identifier) {
  return buildRateLimitKey(scope, getClientIp(request), identifier);
}

export async function consumeRateLimit(request, scope, identifier = '') {
  const policy = RATE_LIMIT_POLICIES[scope];
  if (!policy) {
    throw new Error(`Unknown rate-limit scope: ${scope}`);
  }
  const keyHash = rateLimitIdentity(request, scope, identifier);
  let rows;
  try {
    rows = await rpc('consume_security_rate_limit', {
      p_scope: scope,
      p_key_hash: keyHash,
      p_limit: policy.limit,
      p_window_seconds: policy.windowSeconds,
      p_block_seconds: policy.blockSeconds
    });
  } catch (error) {
    if (!isMissingRateLimitRpc(error)) {
      throw error;
    }
    const fallback = consumeInMemoryRateLimit(fallbackBuckets, `${scope}:${keyHash}`, policy);
    return { ...fallback, keyHash, fallback: true };
  }
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
  fallbackBuckets.delete(`${scope}:${keyHash}`);
  try {
    await rpc('clear_security_rate_limit', { p_scope: scope, p_key_hash: keyHash });
  } catch (error) {
    if (!isMissingRateLimitRpc(error)) {
      throw error;
    }
  }
}

export function rateLimitResponse(retryAfter) {
  return NextResponse.json(
    { error: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.' },
    { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil(retryAfter))) } }
  );
}
