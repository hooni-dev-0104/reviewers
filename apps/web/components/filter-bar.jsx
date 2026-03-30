'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui-kit';
import { cn, inputClass, selectClass } from '@/lib/ui';

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

function normalizeSelection(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean);
  }
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

export function FilterBar({ sources, searchParams }) {
  const [platforms, setPlatforms] = useState(() => normalizeSelection(searchParams.platform).filter((value) => value !== 'all'));
  const [types, setTypes] = useState(() => normalizeSelection(searchParams.type).filter((value) => value !== 'all'));
  const [sourceValues, setSourceValues] = useState(() => normalizeSelection(searchParams.source).filter((value) => value !== 'all'));
  const [showAdvanced, setShowAdvanced] = useState(() => Boolean(platforms.length || types.length || sourceValues.length || searchParams.deadline || searchParams.region || (searchParams.sort && searchParams.sort !== 'deadline')));

  const activeFilterCount = useMemo(
    () => platforms.length + types.length + sourceValues.length + Number(Boolean(searchParams.deadline && searchParams.deadline !== 'all')) + Number(Boolean(searchParams.region)) + Number(Boolean(searchParams.sort && searchParams.sort !== 'deadline')),
    [platforms.length, types.length, sourceValues.length, searchParams.deadline, searchParams.region, searchParams.sort]
  );

  return (
    <form className="rounded-[32px] border border-slate-200/80 bg-white/92 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] ring-1 ring-slate-950/5 backdrop-blur sm:p-8">
      <input type="hidden" name="platform" value={platforms.join(',')} />
      <input type="hidden" name="type" value={types.join(',')} />
      <input type="hidden" name="source" value={sourceValues.join(',')} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">Campaign explorer</span>
            <div className="space-y-2">
              <h2 className="text-[24px] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[32px]">한 번에 좁혀보고 빠르게 결정하세요</h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">검색, 플랫폼, 마감, 지역을 같은 흐름에서 정리해 후보를 빠르게 좁히고 바로 상세 화면으로 이동할 수 있게 만들었습니다.</p>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            활성 필터 <strong className="font-semibold text-slate-950">{activeFilterCount}</strong>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px]">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">검색</span>
            <input
              id="search"
              name="search"
              defaultValue={searchParams.search || ''}
              placeholder="브랜드명, 지역, 혜택으로 검색"
              className={inputClass}
            />
          </label>
          <Button type="submit" variant="primary" size="lg" className="w-full self-end">
            검색
          </Button>
        </div>

        <div className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-950">상세 조건을 열어 더 정확하게 찾기</p>
            <p className="text-sm leading-6 text-slate-500">플랫폼, 유형, 출처, 마감, 지역을 8px 그리드에 맞춰 정돈했습니다.</p>
          </div>
          <Button type="button" variant={showAdvanced ? 'subtle' : 'secondary'} size="sm" onClick={() => setShowAdvanced((value) => !value)}>
            {showAdvanced ? '상세 필터 닫기' : '상세 필터 열기'}
          </Button>
        </div>

        {showAdvanced ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <MultiSelect label="플랫폼" options={PLATFORM_OPTIONS} values={platforms} onChange={setPlatforms} />
            <MultiSelect label="유형" options={TYPE_OPTIONS} values={types} onChange={setTypes} />
            <MultiSelect
              label="출처"
              options={[
                ['all', '전체 출처'],
                ...sources.map((source) => [source.slug, source.name])
              ]}
              values={sourceValues}
              onChange={setSourceValues}
            />
            <Select name="deadline" label="마감" options={DEADLINE_OPTIONS} value={searchParams.deadline || 'all'} />
            <Select name="sort" label="정렬" options={SORT_OPTIONS} value={searchParams.sort || 'deadline'} />
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">지역</span>
              <input
                id="region"
                name="region"
                defaultValue={searchParams.region || ''}
                placeholder="예: 서울, 강남, 수원"
                className={inputClass}
              />
            </label>
          </div>
        ) : null}
      </div>
    </form>
  );
}

function Select({ name, label, options, value }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <select id={name} name={name} defaultValue={value} className={selectClass}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function MultiSelect({ label, options, values, onChange }) {
  const selectedSet = new Set(values);

  function handleSelectChange(event) {
    const value = event.target.value;
    if (value === 'all') {
      onChange([]);
      event.target.value = 'all';
      return;
    }
    if (!selectedSet.has(value)) {
      onChange([...values, value]);
    }
    event.target.value = 'all';
  }

  function handleRemove(value) {
    onChange(values.filter((item) => item !== value));
  }

  return (
    <div className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-4">
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
        <select defaultValue="all" onChange={handleSelectChange} className={selectClass}>
          {options.map(([optionValue, optionLabel]) => (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          ))}
        </select>
      </label>
      <div className="flex min-h-10 flex-wrap gap-2">
        {values.length ? values.map((value) => {
          const labelText = options.find(([optionValue]) => optionValue === value)?.[1] || value;
          return (
            <button
              key={value}
              type="button"
              className={cn('inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100')}
              onClick={() => handleRemove(value)}
            >
              {labelText}
              <span aria-hidden="true">×</span>
            </button>
          );
        }) : <span className="inline-flex items-center rounded-full border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400">선택된 조건 없음</span>}
      </div>
    </div>
  );
}
