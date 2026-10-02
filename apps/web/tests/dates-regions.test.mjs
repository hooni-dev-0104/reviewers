import test from 'node:test';
import assert from 'node:assert/strict';
import { deadlineState, deadlineWindowEnd, kstDay } from '../lib/dates.js';
import { canonicalRegion, normalizeRegion, regionConditions, regionHierarchy } from '../lib/regions.js';

test('KST date deadlines stay open through midnight; timestamps expire immediately', () => {
  assert.equal(deadlineState('2026-10-01', Date.parse('2026-10-01T14:59:59Z')).label, '오늘 마감');
  assert.equal(deadlineState('2026-10-01', Date.parse('2026-10-01T15:00:00Z')).label, '마감 지남');
  assert.equal(deadlineState('2026-10-01T12:00:00Z', Date.parse('2026-10-01T12:00:01Z')).label, '마감 지남');
  assert.equal(deadlineState('2026-02-30').label, '일정 확인 필요');
  assert.equal(kstDay('2026-12-31T15:00:00Z'), '2027-01-01');
  assert.equal(deadlineWindowEnd('today', '2026-10-01T01:00:00Z'), '2026-10-01T15:00:00.000Z');
  assert.equal(deadlineWindowEnd('3days', '2026-12-31T01:00:00Z'), '2027-01-03T15:00:00.000Z');
});
test('province context separates duplicate districts and Gwangju', () => {
  assert.equal(canonicalRegion('광주'), '광주');
  for (const value of ['광주시', '강서구', '중구', '서구', '']) assert.equal(canonicalRegion(value), null);
  assert.deepEqual(normalizeRegion('경기도', '광주시'), { primary: '경기', secondary: '광주시', needsReview: false });
  for (const primary of ['서울', '부산']) {
    const conditions = regionConditions({ regionPrimary: primary, regionSecondary: '강서구' });
    assert.equal(conditions.length, 2);
    assert.match(conditions[0], new RegExp(`in.\\(${primary},`));
    assert.equal(conditions[1], 'region_secondary_name.eq.강서구');
  }
  const hierarchy = regionHierarchy([{ region_primary_name: '서울', region_secondary_name: '강서구' }, { region_primary_name: '부산', region_secondary_name: '강서구' }]);
  assert.deepEqual(hierarchy, { 부산: ['강서구'], 서울: ['강서구'] });
  assert.equal(regionConditions({ regionPrimary: '서울' }).length, 1);
  assert.equal(normalizeRegion(null, '중구').needsReview, true);
});

test('list and count query builder uses AND province/district and identical KST windows', async () => {
  const { applyCampaignFilters } = await import('../lib/campaign-query.js');
  const list = new URLSearchParams(), count = new URLSearchParams();
  const query = { regionPrimary: '부산', regionSecondary: '강서구', deadline: 'today' };
  const now = Date.parse('2026-10-01T01:00:00Z');
  applyCampaignFilters(list, query, { now });
  applyCampaignFilters(count, query, { now, forCount: true });
  assert.match(list.get('and'), /region_primary_name.in.\(부산,부산시,부산광역시\),region_secondary_name.eq.강서구/);
  assert.equal(list.get('apply_deadline'), 'lt.2026-10-01T15:00:00.000Z');
  assert.match(list.get('and'), /apply_deadline.gte.2026-10-01T01:00:00.000Z/);
  list.delete('limit'); list.delete('offset');
  assert.equal(list.toString(), count.toString());
});
