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

const NON_LOCATION_TAGS = new Set(['배송형', '구매평', '기자단', '방문형', '클립', '서비스', '블로그', '인스타', '유튜브', '릴스']);
const EXACT_MAP_SOURCE_SLUGS = new Set(['seouloppa', 'gangnammatzip']);

export function formatText(value) {
  return String(value || '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&nbsp;', ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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
    return { label: '원문 참고', tone: 'warn' };
  }
  if (!record.apply_deadline || !record.benefit_text) {
    return { label: '정보 일부 확인', tone: 'muted' };
  }
  return { label: '핵심 정보 충분', tone: 'ok' };
}

export function formatCount(value) {
  return new Intl.NumberFormat('ko-KR').format(value || 0);
}

function splitLeadingAnnotations(value) {
  const annotations = [];
  let remaining = formatText(value);

  while (remaining.startsWith('[')) {
    const end = remaining.indexOf(']');
    if (end === -1) {
      break;
    }
    annotations.push(remaining.slice(1, end).trim());
    remaining = remaining.slice(end + 1).trim();
  }

  return {
    annotations,
    cleaned: remaining || formatText(value)
  };
}

function looksLikeLocationTag(value) {
  const token = formatText(value);
  if (!token || NON_LOCATION_TAGS.has(token)) {
    return false;
  }

  return /(?:서울|경기|인천|부산|대구|대전|광주|울산|세종|강원|충북|충남|전북|전남|경북|경남|제주|시|군|구|동|읍|면|로|길)/.test(token);
}

function uniqueParts(parts) {
  return [...new Set(parts.map((part) => formatText(part)).filter(Boolean))];
}

export function getMapSearchQuery(record) {
  if (!record) {
    return null;
  }

  const title = formatText(record.title);
  if (!title) {
    return null;
  }

  const { annotations, cleaned } = splitLeadingAnnotations(title);
  const annotationLocation = annotations.find(looksLikeLocationTag);
  const locationHint = annotationLocation ? annotationLocation.replaceAll('/', ' ') : null;
  const parts = uniqueParts([
    record.region_primary_name,
    record.region_secondary_name,
    locationHint,
    cleaned
  ]);

  if (!parts.length) {
    return null;
  }

  const hasLocation = parts.some((part) => looksLikeLocationTag(part));
  const isVisitLike = record.campaign_type === 'visit' || Boolean(record.region_primary_name || record.region_secondary_name || locationHint);

  if (!hasLocation && !isVisitLike) {
    return null;
  }

  return parts.join(' ');
}

export function getKakaoMapSearchUrl(record) {
  const query = getMapSearchQuery(record);
  return query ? `https://map.kakao.com/link/search/${encodeURIComponent(query)}` : null;
}

export function getNaverMapSearchUrl(record) {
  const query = getMapSearchQuery(record);
  return query ? `https://map.naver.com/p/search/${encodeURIComponent(query)}` : null;
}

export function getInternalMapLaunchUrl(record, provider) {
  if (!record?.id || !provider) {
    return null;
  }
  return `/api/map-link?id=${encodeURIComponent(record.id)}&provider=${encodeURIComponent(provider)}`;
}

export function supportsExactMap(record) {
  return EXACT_MAP_SOURCE_SLUGS.has(record?.sources?.slug || '') && record?.campaign_type === 'visit';
}
