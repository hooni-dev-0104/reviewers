'use client';

import { useState } from 'react';

import { Button, FilterChip, SearchField, Select } from '@/components/ui';

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

function toggleValue(values, value) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function platformIcon(value) {
  return {
    blog: 'pen-line',
    instagram: 'instagram',
    youtube: 'youtube',
    mixed: 'layout-grid'
  }[value] || 'layout-grid';
}

export function FilterBar({ sources, searchParams }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [platforms, setPlatforms] = useState(() => normalizeSelection(searchParams.platform).filter((value) => value !== 'all'));
  const [types, setTypes] = useState(() => normalizeSelection(searchParams.type).filter((value) => value !== 'all'));
  const [sourceValues, setSourceValues] = useState(() => normalizeSelection(searchParams.source).filter((value) => value !== 'all'));
  const [deadline, setDeadline] = useState(searchParams.deadline || 'all');
  const [sort, setSort] = useState(searchParams.sort || 'deadline');

  function setDeadlineQuickValue(value) {
    setDeadline((current) => (current === value ? 'all' : value));
  }

  return (
    <form className="filter-shell rk-filter-shell">
      <input type="hidden" name="platform" value={platforms.join(',')} />
      <input type="hidden" name="type" value={types.join(',')} />
      <input type="hidden" name="source" value={sourceValues.join(',')} />
      <input type="hidden" name="deadline" value={deadline} />
      <input type="hidden" name="sort" value={sort} />

      <div className="search-row search-row-primary">
        <SearchField
          id="search"
          name="search"
          label="검색"
          defaultValue={searchParams.search || ''}
          placeholder="브랜드, 지역, 혜택으로 검색"
          className="search-stack-grow"
        />
        <Button type="submit" className="search-submit">검색</Button>
      </div>

      <div className="rk-chiprow filter-quick-row" aria-label="빠른 필터">
        {PLATFORM_OPTIONS.filter(([value]) => value !== 'all').map(([value, label]) => (
          <FilterChip
            key={value}
            icon={platformIcon(value)}
            selected={platforms.includes(value)}
            onClick={() => setPlatforms(toggleValue(platforms, value))}
          >
            {label}
          </FilterChip>
        ))}
        {DEADLINE_OPTIONS.filter(([value]) => value !== 'all').map(([value, label]) => (
          <FilterChip
            key={value}
            icon="clock"
            selected={deadline === value}
            onClick={() => setDeadlineQuickValue(value)}
          >
            {label}
          </FilterChip>
        ))}
      </div>

      <div className="filter-toggle-row">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="filter-toggle"
          aria-expanded={showAdvanced}
          onClick={() => setShowAdvanced((value) => !value)}
        >
          {showAdvanced ? '상세 필터 닫기' : '상세 필터 열기'}
        </Button>
      </div>

      {showAdvanced ? (
        <div className="filter-grid">
          <MultiSelect
            label="플랫폼"
            options={PLATFORM_OPTIONS}
            values={platforms}
            onChange={setPlatforms}
          />
          <MultiSelect
            label="유형"
            options={TYPE_OPTIONS}
            values={types}
            onChange={setTypes}
          />
          <MultiSelect
            label="출처"
            options={[
              ['all', '전체 출처'],
              ...sources.map((source) => [source.slug, source.name])
            ]}
            values={sourceValues}
            onChange={setSourceValues}
          />
          <SelectField name="deadline" label="마감" options={DEADLINE_OPTIONS} value={deadline} onChange={setDeadline} />
          <SelectField name="sort" label="정렬" options={SORT_OPTIONS} value={sort} onChange={setSort} />
          <label className="rk-field" htmlFor="region">
            <span className="rk-field__label">지역</span>
            <input
              id="region"
              name="region"
              className="rk-input"
              defaultValue={searchParams.region || ''}
              placeholder="예: 서울, 강남, 수원"
            />
          </label>
        </div>
      ) : null}
    </form>
  );
}

function SelectField({ name, label, options, value, onChange }) {
  return (
    <Select id={name} label={label} value={value} onChange={(event) => onChange?.(event.target.value)}>
      {options.map(([optionValue, optionLabel]) => (
        <option key={optionValue} value={optionValue}>
          {optionLabel}
        </option>
      ))}
    </Select>
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
    <div className="rk-field checkbox-group-wrap">
      <label className="rk-field__label" htmlFor={`filter-${label}`}>{label}</label>
      <Select id={`filter-${label}`} defaultValue="all" onChange={handleSelectChange}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </Select>
      {values.length ? (
        <div className="checkbox-group">
          {values.map((value) => {
            const labelText = options.find(([optionValue]) => optionValue === value)?.[1] || value;
            return (
              <FilterChip
                key={value}
                selected
                removable
                aria-label={`${labelText} 필터 제거`}
                onClick={() => handleRemove(value)}
              >
                {labelText}
              </FilterChip>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
