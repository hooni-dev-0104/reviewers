const PLATFORM_LABELS = {
  blog: '블로그',
  instagram: '인스타',
  youtube: '유튜브',
  tiktok: '틱톡',
  mixed: '멀티',
  etc: '기타'
};

const TYPE_LABELS = {
  visit: '방문형',
  delivery: '배송형',
  purchase: '구매형',
  content: '콘텐츠형',
  mixed: '혼합형',
  etc: '기타'
};

const SOURCE_TONES = {
  revu: 'violet',
  reviewnote: 'blue',
  '4blog': 'emerald',
  dinnerqueen: 'rose'
};

export function formatPlatform(value) {
  return PLATFORM_LABELS[value] || '기타';
}

export function formatCampaignType(value) {
  return TYPE_LABELS[value] || '기타';
}

export function formatRegion(record) {
  if (record.region_primary_name && record.region_secondary_name) {
    return `${record.region_primary_name} · ${record.region_secondary_name}`;
  }
  if (record.region_primary_name) {
    return record.region_primary_name;
  }
  return '지역 미상';
}

export function formatSourceName(source) {
  return source?.name || '출처 미상';
}

export function formatSourceTone(slug) {
  return SOURCE_TONES[slug] || 'slate';
}

export function formatDeadline(value) {
  if (!value) {
    return '마감일 미상';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '마감일 미상';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  }).format(date);
}

export function getDeadlineState(value) {
  if (!value) {
    return { label: '일정 확인 필요', tone: 'muted' };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { label: '일정 확인 필요', tone: 'muted' };
  }

  const diffDays = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { label: '마감 지남', tone: 'muted' };
  }
  if (diffDays <= 1) {
    return { label: '오늘·내일 마감', tone: 'danger' };
  }
  if (diffDays <= 3) {
    return { label: '3일 이내 마감', tone: 'warn' };
  }
  if (diffDays <= 7) {
    return { label: '이번 주 마감', tone: 'accent' };
  }
  return { label: '여유 있음', tone: 'ok' };
}

export function getConfidence(record) {
  if (record.requires_review) {
    return { label: '검토 필요', tone: 'warn' };
  }
  if (!record.apply_deadline || !record.benefit_text) {
    return { label: '정보 보강 필요', tone: 'muted' };
  }
  return { label: '정보 안정적', tone: 'ok' };
}

export function formatCount(value) {
  return new Intl.NumberFormat('ko-KR').format(value || 0);
}
