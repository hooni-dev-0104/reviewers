export const SPONSOR_SLOTS = ['feed-inline'];
export function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}
export function sponsorStatus(row, now = Date.now()) {
  if (!row?.is_active) return '비활성';
  const start = Date.parse(row.starts_at), end = Date.parse(row.ends_at);
  if (!SPONSOR_SLOTS.includes(row.slot_key) || !Number.isFinite(start) || !Number.isFinite(end) || start >= end || !safeExternalUrl(row.cta_url)) return '설정 확인 필요';
  if (now < start) return '예약';
  if (now >= end) return '종료';
  return '활성';
}
export function pickSponsor(rows, slotKey, now = Date.now()) {
  return rows.filter(row => row.slot_key === slotKey && sponsorStatus(row, now) === '활성')
    .sort((a, b) => (a.priority - b.priority) || String(a.id).localeCompare(String(b.id)))[0] || null;
}
