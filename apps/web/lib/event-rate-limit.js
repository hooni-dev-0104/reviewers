import { createHmac, randomBytes } from 'node:crypto';
// Transient per-process abuse prevention, never written to database/logs.
const salt = randomBytes(32);
const buckets = new Map();
export function eventRateLimit(request, now = Date.now()) {
  for (const [key, bucket] of buckets) if (bucket.until <= now) buckets.delete(key);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = createHmac('sha256', salt).update(ip.slice(0, 96)).digest('hex');
  const bucket = buckets.get(key) || { count: 0, until: now + 60000 };
  if (!buckets.has(key) && buckets.size >= 10000) return false;
  bucket.count += 1;
  buckets.set(key, bucket);
  return bucket.count <= 60;
}
