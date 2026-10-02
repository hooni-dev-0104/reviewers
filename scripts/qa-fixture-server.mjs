// Local-only synthetic HTTP fixture. No real Supabase credentials, advertisers or metrics.
import http from 'node:http';
const campaigns = Array.from({ length: 30 }, (_, index) => ({
  id: `11111111-1111-4111-8111-${String(index + 1).padStart(12, '0')}`,
  title: `[로컬 테스트] ${index % 2 ? '서울 강서구' : '부산 강서구'} 일상 속 체험 ${index + 1}`,
  benefit_text: '테스트 혜택 · 운영 공고가 아닙니다', snippet: '모바일 화면 검증용 가상 캠페인입니다.',
  region_primary_name: index % 2 ? '서울' : '부산', region_secondary_name: '강서구',
  apply_deadline: '2026-10-10T23:59:59.999+09:00', status: 'active', platform_type: 'blog', campaign_type: 'visit',
  sources: { name: '로컬 테스트 출처', slug: 'revu' }, recruit_count: 5, requires_review: false,
  original_url: 'https://example.com/local-test', last_seen_at: '2026-10-02T00:00:00Z'
}));
let eventCount = 0;
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  let rows = [];
  if (url.pathname === '/qa-events') { res.end(JSON.stringify({ eventCount })); return; }
  if (url.pathname.endsWith('/campaigns')) {
    rows = campaigns;
    if (url.searchParams.has('id')) rows = rows.filter(row => `eq.${row.id}` === url.searchParams.get('id'));
    if (url.searchParams.get('and')?.includes('NO_RESULTS')) rows = [];
  }
  if (url.pathname.endsWith('/sources')) rows = [{ id: 'source-fixture', name: '로컬 테스트 출처', slug: 'revu' }];
  if (url.pathname.endsWith('/sponsor_slots')) rows = [{ id: '22222222-2222-4222-8222-222222222222', slot_key: 'feed-inline', title: '로컬 광고 디자인 확인', body: '실제 광고주가 없는 화면 검증용 데이터입니다.', cta_label: '테스트 광고 링크', cta_url: 'https://example.com/sponsor-test', is_active: true, priority: 1, starts_at: '2026-01-01T00:00:00Z', ends_at: '2027-01-01T00:00:00Z' }];
  if (url.pathname.endsWith('/rpc/record_public_event')) { eventCount++; res.setHeader('Content-Type', 'application/json'); res.end('true'); return; }
  const count = rows.length;
  const offset = Number(url.searchParams.get('offset') || 0), limit = Number(url.searchParams.get('limit') || count);
  res.setHeader('Content-Type', 'application/json'); res.setHeader('Content-Range', `0-${Math.max(0, count - 1)}/${count}`);
  res.end(req.method === 'HEAD' ? undefined : JSON.stringify(rows.slice(offset, offset + limit)));
}).listen(4311, '127.0.0.1', () => console.log('Synthetic fixture listening on 127.0.0.1:4311; never use as production data.'));
