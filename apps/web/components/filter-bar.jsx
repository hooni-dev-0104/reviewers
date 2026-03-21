const PLATFORM_OPTIONS = [
  ['all', '전체 플랫폼'],
  ['blog', '블로그'],
  ['instagram', '인스타'],
  ['youtube', '유튜브'],
  ['mixed', '멀티']
];

const TYPE_OPTIONS = [
  ['all', '전체 유형'],
  ['visit', '방문형'],
  ['delivery', '배송형'],
  ['purchase', '구매형'],
  ['content', '콘텐츠형']
];

const DEADLINE_OPTIONS = [
  ['all', '전체 마감'],
  ['3days', '3일 이내'],
  ['7days', '7일 이내']
];

const TRUST_OPTIONS = [
  ['all', '모든 신뢰도'],
  ['stable', '정보 안정적'],
  ['review', '검토 필요']
];

const SORT_OPTIONS = [
  ['deadline', '마감 임박순'],
  ['newest', '최신 갱신순'],
  ['slots', '모집 인원순'],
  ['trusted', '신뢰도 우선']
];

export function FilterBar({ sources, searchParams }) {
  return (
    <form className="filter-shell">
      <div className="search-row">
        <div className="search-stack">
          <label htmlFor="search">검색</label>
          <input
            id="search"
            name="search"
            defaultValue={searchParams.search || ''}
            placeholder="브랜드명, 지역, 혜택으로 검색"
          />
        </div>
        <button type="submit">탐색하기</button>
      </div>

      <div className="filter-grid">
        <Select name="platform" label="플랫폼" options={PLATFORM_OPTIONS} value={searchParams.platform || 'all'} />
        <Select name="type" label="유형" options={TYPE_OPTIONS} value={searchParams.type || 'all'} />
        <Select
          name="source"
          label="출처"
          options={[
            ['all', '전체 출처'],
            ...sources.map((source) => [source.slug, source.name])
          ]}
          value={searchParams.source || 'all'}
        />
        <Select name="deadline" label="마감" options={DEADLINE_OPTIONS} value={searchParams.deadline || 'all'} />
        <Select name="trust" label="신뢰도" options={TRUST_OPTIONS} value={searchParams.trust || 'all'} />
        <Select name="sort" label="정렬" options={SORT_OPTIONS} value={searchParams.sort || 'deadline'} />
        <div className="search-stack">
          <label htmlFor="region">지역</label>
          <input id="region" name="region" defaultValue={searchParams.region || ''} placeholder="예: 서울, 경기, 강남" />
        </div>
      </div>
    </form>
  );
}

function Select({ name, label, options, value }) {
  return (
    <div className="search-stack">
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} defaultValue={value}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
