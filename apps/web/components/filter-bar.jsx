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
  ['today', '오늘까지'],
  ['3days', '3일 안'],
  ['7days', '7일 안']
];

const SORT_OPTIONS = [
  ['deadline', '마감순'],
  ['newest', '최근 업데이트'],
  ['slots', '모집 많은 순']
];

export function FilterBar({ sources, searchParams, regionOptions }) {
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
        <button type="submit" className="search-submit">검색</button>
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
        <Select name="sort" label="정렬" options={SORT_OPTIONS} value={searchParams.sort || 'deadline'} />
        <div className="search-stack">
          <label htmlFor="region">지역</label>
          <input
            id="region"
            name="region"
            defaultValue={searchParams.region || ''}
            placeholder="예: 서울, 강남, 수원"
          />
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
