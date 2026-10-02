export function trackingAllowed() {
  return typeof navigator !== 'undefined' && navigator.doNotTrack !== '1' && window.doNotTrack !== '1' && navigator.globalPrivacyControl !== true;
}
const clicks = new Map();
export function sendEvent(event, entityId, slot) {
  if (!trackingAllowed()) return;
  const key = `${event}:${entityId}:${slot}`;
  const now = Date.now();
  if ((clicks.get(key) || 0) > now - 1500) return;
  if (clicks.size > 200) clicks.clear();
  clicks.set(key, now);
  void fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event, entityId, slot }), keepalive: true, credentials: 'omit' }).catch(() => {});
}
