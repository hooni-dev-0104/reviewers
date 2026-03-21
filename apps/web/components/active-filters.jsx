import Link from 'next/link';

const LABELS = {
  source: {
    reviewnote: '리뷰노트',
    revu: '레뷰',
    dinnerqueen: '디너의여왕',
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
    '3days': '3일 이내',
    '7days': '7일 이내'
  },
  sort: {
    deadline: '마감 임박순',
    newest: '최신 갱신순',
    slots: '모집 인원순',
    trusted: '신뢰도 우선'
  },
  trust: {
    stable: '정보 안정적',
    review: '검토 필요'
  }
};

export function ActiveFilters({ searchParams = {}, resultCount }) {
  const entries = [
    searchParams.search ? ['검색', searchParams.search] : null,
    searchParams.platform && searchParams.platform !== 'all' ? ['플랫폼', LABELS.platform[searchParams.platform] || searchParams.platform] : null,
    searchParams.type && searchParams.type !== 'all' ? ['유형', LABELS.type[searchParams.type] || searchParams.type] : null,
    searchParams.source && searchParams.source !== 'all' ? ['출처', LABELS.source[searchParams.source] || searchParams.source] : null,
    searchParams.deadline && searchParams.deadline !== 'all' ? ['마감', LABELS.deadline[searchParams.deadline] || searchParams.deadline] : null,
    searchParams.trust && searchParams.trust !== 'all' ? ['신뢰도', LABELS.trust[searchParams.trust] || searchParams.trust] : null,
    searchParams.sort && searchParams.sort !== 'deadline' ? ['정렬', LABELS.sort[searchParams.sort] || searchParams.sort] : null,
    searchParams.region ? ['지역', searchParams.region] : null
  ].filter(Boolean);

  return (
    <div className="results-toolbar">
      <div>
        <strong>{resultCount.toLocaleString('ko-KR')}개</strong>
        <span>지금 조건에 맞는 활성 캠페인</span>
      </div>
      <div className="active-chip-row">
        {entries.length ? entries.map(([label, value]) => <span key={`${label}-${value}`} className="active-filter-chip">{label} · {value}</span>) : <span className="active-filter-empty">필터를 더 좁혀도 되고, 그대로 둘러봐도 좋아요.</span>}
        {entries.length ? <Link className="reset-link" href="/">초기화</Link> : null}
      </div>
    </div>
  );
}
