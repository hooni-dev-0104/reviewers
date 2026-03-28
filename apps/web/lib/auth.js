import 'server-only';

import crypto from 'node:crypto';
import { cookies } from 'next/headers';

import { deleteRows, insertRows, selectOne, selectRows } from '@/lib/server-data';
import { requireEnv } from '@/lib/env';

const SESSION_COOKIE = 'rv_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const digest = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${digest}`;
}

export function verifyPassword(password, stored) {
  const [salt, digest] = String(stored || '').split(':');
  if (!salt || !digest) {
    return false;
  }
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(digest, 'hex'));
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
  await insertRows('user_sessions', [{ user_id: userId, token_hash: hashToken(token), expires_at: expiresAt }]);
  return { token, expiresAt };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const session = await selectOne('user_sessions', {
    select: 'user_id,expires_at',
    token_hash: `eq.${hashToken(token)}`,
    expires_at: `gt.${new Date().toISOString()}`
  });

  if (!session?.user_id) {
    return null;
  }

  return selectOne('app_users', {
    select: 'id,email,display_name,created_at',
    id: `eq.${session.user_id}`
  });
}

export async function setSessionCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await deleteRows('user_sessions', { token_hash: `eq.${hashToken(token)}` });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function validatePassword(value) {
  return typeof value === 'string' && value.length >= 8;
}

export function requireOpsKey(input) {
  return input === (process.env.OPS_DASHBOARD_KEY || '');
}

export async function verifyOpsKey(input) {
  const normalized = String(input || '').trim();
  if (!normalized) {
    return false;
  }

  try {
    const rows = await selectRows('ops_access_keys', {
      select: 'passcode_hash',
      is_active: 'eq.true',
      limit: '20'
    });
    if (Array.isArray(rows) && rows.length) {
      return rows.some((row) => verifyPassword(normalized, row.passcode_hash));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || '');
    if (!message.includes('ops_access_keys')) {
      throw error;
    }
  }

  return requireOpsKey(normalized);
}

export function signOpsCookie() {
  return crypto.createHmac('sha256', requireEnv('OPS_DASHBOARD_KEY')).update('ops-auth').digest('hex');
}

export function isValidOpsCookie(value) {
  if (!value) {
    return false;
  }
  const expected = signOpsCookie();
  return crypto.timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}
