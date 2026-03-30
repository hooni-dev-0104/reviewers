import { ButtonLink, Badge, Surface } from '@/components/ui-kit';

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
    <Surface className="flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">Result overview</span>
        <div className="space-y-2">
          <strong className="block text-[28px] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[36px]">
            {resultCount.toLocaleString('ko-KR')}개 캠페인
          </strong>
          <p className="text-sm leading-6 text-slate-600 sm:text-base">핵심 정보 중심 카드로 정렬해 비교 효율을 높였습니다. 조건이 많아질수록 아래 배지에서 빠르게 확인하세요.</p>
        </div>
      </div>

      <div className="flex max-w-3xl flex-wrap items-center gap-3 sm:justify-end">
        {entries.length ? entries.map(([label, value]) => (
          <Badge key={`${label}-${value}`} tone="brand" className="max-w-full text-left">
            <span className="truncate">{label} · {value}</span>
          </Badge>
        )) : <Badge>현재는 전체 탐색 상태예요</Badge>}
        <ButtonLink href="/" variant="secondary" size="sm">초기화</ButtonLink>
      </div>
    </Surface>
  );
}
