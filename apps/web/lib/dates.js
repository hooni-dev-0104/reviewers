const DAY = 86400000;
export function kstDay(now = Date.now()) {
  return new Date(Number(new Date(now)) + 9 * 3600000).toISOString().slice(0, 10);
}
export function deadlineInstant(value) {
  if (!value) return NaN;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00Z`);
    if (!Number.isFinite(+parsed) || parsed.toISOString().slice(0, 10) !== value) return NaN;
    return +parsed + 15 * 3600000 - 1;
  }
  // Timestamp deadlines must explicitly identify their timezone.
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value)) return NaN;
  return Date.parse(value);
}
export function deadlineWindowEnd(filter, now = Date.now()) {
  const days = { today: 0, '3days': 3, '7days': 7 }[filter];
  if (days === undefined) return null;
  return new Date(Date.parse(`${kstDay(now)}T00:00:00+09:00`) + (days + 1) * DAY).toISOString();
}
export function deadlineState(value, now = Date.now()) {
  const instant = deadlineInstant(value);
  if (!Number.isFinite(instant)) return { label: '일정 확인 필요', tone: 'muted' };
  if (instant < +new Date(now)) return { label: '마감 지남', tone: 'muted' };
  const days = (Date.parse(kstDay(instant)) - Date.parse(kstDay(now))) / DAY;
  if (days === 0) return { label: '오늘 마감', tone: 'danger' };
  if (days === 1) return { label: '내일 마감', tone: 'danger' };
  if (days <= 3) return { label: '3일 이내 마감', tone: 'warn' };
  if (days <= 7) return { label: '이번 주 마감', tone: 'accent' };
  return { label: '여유 있음', tone: 'ok' };
}
