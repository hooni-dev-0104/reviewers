// Optional isolated PostgreSQL-compatible validation: PGLITE_MODULE=file:///.../index.js node ...
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const id = '11111111-1111-4111-8111-111111111111';
try {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create table public.campaigns(id uuid primary key, status text);
    create table public.sponsor_slots(id uuid primary key, slot_key text, is_active boolean, starts_at timestamptz, ends_at timestamptz);
    grant usage on schema public to service_role, anon, authenticated;
    grant select on public.campaigns, public.sponsor_slots to service_role;
    insert into public.campaigns values ('${id}', 'active');
    insert into public.sponsor_slots values ('${id}', 'feed-inline', true, now()-interval '1 day', now()+interval '1 day');`);
  await db.exec(await readFile(new URL('../../../docs/sql/ad-events-proposal.sql', import.meta.url), 'utf8'));
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`set role ${role}`);
    for (const sql of ['select * from public.ad_event_daily', `insert into public.ad_event_daily values (current_date, 'sponsor_click', '${id}', 'feed-inline', 1)`, 'select public.ad_event_report(7)', `select public.record_public_event('sponsor_click', '${id}', 'feed-inline')`]) {
      await assert.rejects(db.query(sql), /permission denied/);
    }
    await db.exec('reset role');
  }
  await db.exec('set role service_role');
  const results = await Promise.all(Array.from({ length: 50 }, () => db.query(`select public.record_public_event('sponsor_click', '${id}', 'feed-inline') as ok`)));
  assert.ok(results.every(r => r.rows[0].ok));
  const count = await db.query('select event_count, event_date::text from public.ad_event_daily');
  assert.equal(Number(count.rows[0].event_count), 50);
  const day = (await db.query("select (now() at time zone 'Asia/Seoul')::date::text as day")).rows[0].day;
  assert.equal(count.rows[0].event_date, day);
  assert.equal((await db.query(`select public.record_public_event('sponsor_click', '22222222-2222-4222-8222-222222222222', 'feed-inline') as ok`)).rows[0].ok, false);
  assert.equal((await db.query(`select public.record_public_event('purchase', '${id}', 'feed-inline') as ok`)).rows[0].ok, false);
  const report = (await db.query('select public.ad_event_report(7) as report')).rows[0].report;
  assert.equal(report.rows[0].clicks, 50);
  assert.equal(report.rows[0].impressions, null);
  assert.equal(report.end, day);
  await db.exec('reset role');
  await db.exec(`update public.sponsor_slots set ends_at = now();`);
  await db.exec('set role service_role');
  assert.equal((await db.query(`select public.record_public_event('sponsor_click', '${id}', 'feed-inline') as ok`)).rows[0].ok, false);
  await db.exec(`insert into public.ad_event_daily values (current_date - 100, 'sponsor_click', '${id}', 'feed-inline', 99); select public.purge_ad_events();`);
  assert.equal((await db.query('select count(*)::int as n from public.ad_event_daily')).rows[0].n, 1);
  console.log('PASS: isolated SQL roles/RLS grants, atomic increments, invalid IDs, expiry, KST date, report and retention.');
  console.log('LIMIT: PGlite serializes concurrent client submissions; multi-session server contention and PostgREST not exercised.');
} finally { await db.close(); }
