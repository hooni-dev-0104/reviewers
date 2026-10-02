// Only explicit province names establish context. District names never infer it.
export const PRIMARY_REGIONS = {
  서울: ['서울', '서울시', '서울특별시'], 경기: ['경기', '경기도'],
  인천: ['인천', '인천시', '인천광역시'], 부산: ['부산', '부산시', '부산광역시'],
  대구: ['대구', '대구시', '대구광역시'], 대전: ['대전', '대전시', '대전광역시'],
  광주: ['광주', '광주광역시'], 울산: ['울산', '울산시', '울산광역시'],
  세종: ['세종', '세종시', '세종특별자치시'], 강원: ['강원', '강원도', '강원특별자치도'],
  충북: ['충북', '충청북도'], 충남: ['충남', '충청남도'],
  전북: ['전북', '전라북도', '전북특별자치도'], 전남: ['전남', '전라남도'],
  경북: ['경북', '경상북도'], 경남: ['경남', '경상남도'],
  제주: ['제주', '제주도', '제주특별자치도']
};
export function canonicalRegion(value) {
  const raw = String(value || '').trim();
  return Object.entries(PRIMARY_REGIONS).find(([, aliases]) => aliases.includes(raw))?.[0] || null;
}
export function normalizeRegion(primary, secondary) {
  const province = canonicalRegion(primary);
  const district = String(secondary || '').trim();
  return { primary: province, secondary: province && district && !canonicalRegion(district) ? district : null, needsReview: !province };
}
export function regionConditions({ regionPrimary, regionSecondary, region }) {
  const primary = canonicalRegion(regionPrimary && regionPrimary !== 'all' ? regionPrimary : region);
  if (!primary) {
    // Unsupported/ambiguous explicit region must not silently broaden results.
    return [regionPrimary, regionSecondary, region].some(v => v && v !== 'all') ? ['region_primary_name.eq.__unresolved__'] : [];
  }
  const conditions = [`region_primary_name.in.(${PRIMARY_REGIONS[primary].join(',')})`];
  if (regionSecondary && regionSecondary !== 'all') conditions.push(`region_secondary_name.eq.${regionSecondary}`);
  return conditions;
}
export function regionHierarchy(rows) {
  const hierarchy = {};
  for (const row of rows) {
    const { primary, secondary } = normalizeRegion(row.region_primary_name, row.region_secondary_name);
    if (!primary) continue;
    hierarchy[primary] ||= new Set();
    if (secondary) hierarchy[primary].add(secondary);
  }
  return Object.fromEntries(Object.entries(hierarchy).sort(([a], [b]) => a.localeCompare(b, 'ko')).map(([primary, values]) => [primary, [...values].sort((a, b) => a.localeCompare(b, 'ko'))]));
}
