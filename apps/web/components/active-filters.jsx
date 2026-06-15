import Link from 'next/link';

import { Badge } from '@/components/ui';

function normalizeSelection(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean);
  }
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

const LABELS = {
  source: {
    reviewnote: '리뷰노트',
    revu: '레뷰',
    dinnerqueen: '디너의여왕',
    ringble: '링블',
    nolowa: '놀러와',
    '4blog': '포블로그'
  },
  platform: {
    blog: '블로그',
    instagram: '인스타',
    youtube: '유튜브',
    mixed: '멀티'
  },
  type: {
    visit: '방문형',
    delivery: '배송형',
    purchase: '구매형',
    content: '콘텐츠형'
  },
  deadline: {
    today: '오늘까지',
    '3days': '3일 이내',
    '7days': '7일 이내'
  },
  sort: {
    deadline: '마감순',
    newest: '최근 업데이트',
    slots: '모집 많은 순',
    trusted: '우선 검토'
  }
};

export function ActiveFilters({ searchParams = {}, resultCount }) {
  const platformValues = normalizeSelection(searchParams.platform).filter((value) => value !== 'all');
  const typeValues = normalizeSelection(searchParams.type).filter((value) => value !== 'all');
  const sourceValues = normalizeSelection(searchParams.source).filter((value) => value !== 'all');

  const entries = [
    searchParams.search ? ['검색', searchParams.search] : null,
    platformValues.length ? ['플랫폼', platformValues.map((value) => LABELS.platform[value] || value).join(', ')] : null,
    typeValues.length ? ['유형', typeValues.map((value) => LABELS.type[value] || value).join(', ')] : null,
    sourceValues.length ? ['출처', sourceValues.map((value) => LABELS.source[value] || value).join(', ')] : null,
    searchParams.deadline && searchParams.deadline !== 'all' ? ['마감', LABELS.deadline[searchParams.deadline] || searchParams.deadline] : null,
    searchParams.sort && searchParams.sort !== 'deadline' ? ['정렬', LABELS.sort[searchParams.sort] || searchParams.sort] : null,
    searchParams.region ? ['지역', searchParams.region] : null
  ].filter(Boolean);

  return (
    <div className="rk-results">
      <div className="rk-results__count">
        <strong>{resultCount.toLocaleString('ko-KR')}개</strong>
        <span> · 선택한 조건에 맞는 캠페인</span>
      </div>
      <div className="rk-results__chips">
        {entries.length ? (
          entries.map(([label, value]) => <Badge key={`${label}-${value}`} tone="neutral">{label} · {value}</Badge>)
        ) : (
          <span className="active-filter-empty">조건을 넓히면 더 많이 보여드릴게요.</span>
        )}
        {entries.length ? <Link className="rk-results__reset" href="/">조건 초기화</Link> : null}
      </div>
    </div>
  );
}
