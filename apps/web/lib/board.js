import 'server-only';

import { hashPassword, verifyPassword } from '@/lib/auth';
import { insertRows, selectOne, selectRows } from '@/lib/server-data';

const BOARD_VISIBILITIES = new Set(['public', 'private']);

function isBoardTableUnavailable(error) {
  const message = error instanceof Error ? error.message : String(error || '');
  return message.includes('board_posts');
}

export function normalizeBoardVisibility(value) {
  const normalized = String(value || 'public').trim().toLowerCase();
  return BOARD_VISIBILITIES.has(normalized) ? normalized : 'public';
}

export function formatBoardDate(value) {
  if (!value) {
    return '작성일 미상';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '작성일 미상';
  }
  return date.toLocaleString('ko-KR');
}

function sanitizeBoardPost(row, { includeBody = false } = {}) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    visibility: row.visibility,
    nickname: row.nickname,
    title: row.title,
    body: includeBody ? row.body : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_deleted: Boolean(row.is_deleted)
  };
}

function normalizeText(value) {
  return String(value || '').trim();
}

export function validateBoardPostInput(input = {}) {
  const visibility = normalizeBoardVisibility(input.visibility);
  const nickname = normalizeText(input.nickname);
  const title = normalizeText(input.title);
  const body = normalizeText(input.body);
  const password = String(input.password || '').trim();

  if (nickname.length < 2 || nickname.length > 20) {
    return { error: '닉네임은 2자 이상 20자 이하로 입력해 주세요.' };
  }
  if (title.length < 2 || title.length > 120) {
    return { error: '제목은 2자 이상 120자 이하로 입력해 주세요.' };
  }
  if (body.length < 1 || body.length > 5000) {
    return { error: '본문은 1자 이상 5000자 이하로 입력해 주세요.' };
  }
  if (visibility === 'private' && (password.length < 4 || password.length > 64)) {
    return { error: '비공개 글 비밀번호는 4자 이상 64자 이하로 입력해 주세요.' };
  }

  return {
    visibility,
    nickname,
    title,
    body,
    password
  };
}

export async function listBoardPosts({ visibility = 'all', limit = 50 } = {}) {
  try {
    const params = {
      select: 'id,visibility,nickname,title,body,created_at,updated_at,is_deleted',
      is_deleted: 'eq.false',
      order: 'created_at.desc',
      limit: String(Math.max(1, Math.min(limit, 100)))
    };
    const normalizedVisibility = normalizeBoardVisibility(visibility);
    if (visibility !== 'all') {
      params.visibility = `eq.${normalizedVisibility}`;
    }

    const rows = await selectRows('board_posts', params);
    return rows.map((row) =>
      sanitizeBoardPost(row, { includeBody: row.visibility === 'public' })
    );
  } catch (error) {
    if (isBoardTableUnavailable(error)) {
      return [];
    }
    throw error;
  }
}

export async function createBoardPost(input = {}) {
  const validated = validateBoardPostInput(input);
  if ('error' in validated) {
    throw new Error(validated.error);
  }

  let rows;
  try {
    rows = await insertRows('board_posts', [
      {
        visibility: validated.visibility,
        nickname: validated.nickname,
        title: validated.title,
        body: validated.body,
        password_hash: validated.visibility === 'private' ? hashPassword(validated.password) : null
      }
    ]);
  } catch (error) {
    if (isBoardTableUnavailable(error)) {
      throw new Error('게시판 기능 준비를 위해 DB 스키마 적용이 아직 필요해요.');
    }
    throw error;
  }

  return sanitizeBoardPost(rows?.[0], { includeBody: validated.visibility === 'public' });
}

export async function getBoardPostForPublic(id) {
  let row;
  try {
    row = await selectOne('board_posts', {
      select: 'id,visibility,nickname,title,body,created_at,updated_at,is_deleted',
      id: `eq.${id}`,
      is_deleted: 'eq.false'
    });
  } catch (error) {
    if (isBoardTableUnavailable(error)) {
      return null;
    }
    throw error;
  }
  if (!row) {
    return null;
  }
  return sanitizeBoardPost(row, { includeBody: row.visibility === 'public' });
}

export async function getBoardPostForOps(id) {
  let row;
  try {
    row = await selectOne('board_posts', {
      select: 'id,visibility,nickname,title,body,created_at,updated_at,is_deleted',
      id: `eq.${id}`,
      is_deleted: 'eq.false'
    });
  } catch (error) {
    if (isBoardTableUnavailable(error)) {
      return null;
    }
    throw error;
  }
  if (!row) {
    return null;
  }
  return sanitizeBoardPost(row, { includeBody: true });
}

export async function unlockPrivateBoardPost(id, nickname, password) {
  let row;
  try {
    row = await selectOne('board_posts', {
      select: 'id,visibility,nickname,title,body,created_at,updated_at,is_deleted,password_hash',
      id: `eq.${id}`,
      is_deleted: 'eq.false'
    });
  } catch (error) {
    if (isBoardTableUnavailable(error)) {
      return null;
    }
    throw error;
  }
  if (!row || row.visibility !== 'private') {
    return null;
  }

  if (normalizeText(row.nickname) !== normalizeText(nickname)) {
    return null;
  }
  if (!verifyPassword(String(password || ''), row.password_hash)) {
    return null;
  }

  return sanitizeBoardPost(row, { includeBody: true });
}
