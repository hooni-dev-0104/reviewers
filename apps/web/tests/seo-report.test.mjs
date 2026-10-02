import assert from 'node:assert/strict';
import test from 'node:test';
import { campaignMetadata } from '../lib/seo.js';
import { reportTotals } from '../lib/event-report.js';
import robots from '../app/robots.js';
import sitemap from '../app/sitemap.js';
test('campaign metadata preserves facts and excludes expired or missing pages', () => {
  const row = { id: 'test', status: 'active', title: '원문 제목', benefit_text: '실제 혜택', apply_deadline: '2026-10-02' };
  const meta = campaignMetadata(row, Date.parse('2026-10-01T00:00:00Z'));
  assert.equal(meta.alternates.canonical, '/campaign/test');
  assert.equal(meta.robots.index, true);
  assert.equal(meta.openGraph.title, meta.title);
  assert.equal(campaignMetadata(row, Date.parse('2026-10-03T00:00:00Z')).robots.index, false);
  assert.equal(campaignMetadata(null).robots.index, false);
  assert.equal(campaignMetadata({ ...row, status: 'hidden' }).robots.index, false);
  assert.ok(robots().rules[0].disallow.includes('/ops'));
  assert.ok(sitemap().every(x => !x.url.includes('?')));
});
test('report totals distinguish zero denominator and sum all returned groups', () => {
  assert.deepEqual(reportTotals([]), { impressions: 0, clicks: 0, outbound: 0, ctr: null });
  assert.deepEqual(reportTotals([{ impressions: 100, clicks: 2 }, { impressions: 100, clicks: 3, outbound: 4 }]), { impressions: 200, clicks: 5, outbound: 4, ctr: 2.5 });
});
