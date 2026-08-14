begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.timezone('utc', pg_catalog.now());
  return new;
end;
$$;

create index if not exists idx_categories_parent_id on public.categories (parent_id);
create index if not exists idx_regions_parent_id on public.regions (parent_id);
create index if not exists idx_crawl_errors_crawl_job_id on public.crawl_errors (crawl_job_id);
create index if not exists idx_user_saved_campaigns_campaign_id on public.user_saved_campaigns (campaign_id);
create index if not exists idx_reminder_subscriptions_campaign_id on public.reminder_subscriptions (campaign_id);

create table if not exists public.security_rate_limits (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null default pg_catalog.now(),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  blocked_until timestamptz,
  updated_at timestamptz not null default pg_catalog.now(),
  constraint security_rate_limits_scope_key_hash_key unique (scope, key_hash),
  constraint security_rate_limits_key_hash_format check (key_hash ~ '^[a-f0-9]{64}$')
);

create index if not exists idx_security_rate_limits_updated_at
  on public.security_rate_limits (updated_at);

alter table public.security_rate_limits enable row level security;

drop policy if exists "Service role only security rate limits" on public.security_rate_limits;
create policy "Service role only security rate limits"
on public.security_rate_limits for all
using (false)
with check (false);

create or replace function public.consume_security_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer,
  p_block_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer, attempt_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.now();
  v_row public.security_rate_limits%rowtype;
  v_limit integer := pg_catalog.greatest(1, pg_catalog.least(p_limit, 1000));
  v_window integer := pg_catalog.greatest(1, pg_catalog.least(p_window_seconds, 86400));
  v_block integer := pg_catalog.greatest(1, pg_catalog.least(p_block_seconds, 86400));
begin
  if p_scope is null or p_scope !~ '^[a-z][a-z0-9_-]{0,31}$' then
    raise exception 'invalid rate-limit scope';
  end if;
  if p_key_hash is null or p_key_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid rate-limit key';
  end if;

  insert into public.security_rate_limits (scope, key_hash, window_started_at, attempt_count, updated_at)
  values (p_scope, p_key_hash, v_now, 0, v_now)
  on conflict (scope, key_hash) do nothing;

  select * into v_row
  from public.security_rate_limits
  where scope = p_scope and key_hash = p_key_hash
  for update;

  if v_row.blocked_until is not null and v_row.blocked_until > v_now then
    return query select false,
      pg_catalog.greatest(1, pg_catalog.ceil(pg_catalog.extract(epoch from (v_row.blocked_until - v_now)))::integer),
      v_row.attempt_count;
    return;
  end if;

  if v_row.window_started_at + pg_catalog.make_interval(secs => v_window) <= v_now then
    v_row.window_started_at := v_now;
    v_row.attempt_count := 0;
    v_row.blocked_until := null;
  end if;

  v_row.attempt_count := v_row.attempt_count + 1;
  if v_row.attempt_count > v_limit then
    v_row.blocked_until := v_now + pg_catalog.make_interval(secs => v_block);
  end if;

  update public.security_rate_limits
  set window_started_at = v_row.window_started_at,
      attempt_count = v_row.attempt_count,
      blocked_until = v_row.blocked_until,
      updated_at = v_now
  where scope = p_scope and key_hash = p_key_hash;

  if v_row.blocked_until is not null then
    return query select false, v_block, v_row.attempt_count;
  else
    return query select true,
      pg_catalog.greatest(1, pg_catalog.ceil(pg_catalog.extract(epoch from (
        v_row.window_started_at + pg_catalog.make_interval(secs => v_window) - v_now
      )))::integer),
      v_row.attempt_count;
  end if;
end;
$$;

create or replace function public.clear_security_rate_limit(p_scope text, p_key_hash text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.security_rate_limits
  where scope = p_scope and key_hash = p_key_hash;
$$;

create or replace view public.public_board_posts
with (security_barrier = true)
as
select
  id,
  visibility,
  nickname,
  title,
  case when visibility = 'public' then body else null end as body,
  created_at,
  updated_at
from public.board_posts
where is_deleted = false;

alter table public.campaign_snapshots enable row level security;
alter table public.crawl_jobs enable row level security;
alter table public.crawl_errors enable row level security;
alter table public.source_policies enable row level security;

drop policy if exists "Service role only campaign snapshots" on public.campaign_snapshots;
create policy "Service role only campaign snapshots" on public.campaign_snapshots
for all using (false) with check (false);
drop policy if exists "Service role only crawl jobs" on public.crawl_jobs;
create policy "Service role only crawl jobs" on public.crawl_jobs
for all using (false) with check (false);
drop policy if exists "Service role only crawl errors" on public.crawl_errors;
create policy "Service role only crawl errors" on public.crawl_errors
for all using (false) with check (false);
drop policy if exists "Service role only source policies" on public.source_policies;
create policy "Service role only source policies" on public.source_policies
for all using (false) with check (false);

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.sources, public.categories, public.regions, public.campaigns,
  public.sponsor_slots, public.public_board_posts to anon, authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

revoke all on function public.consume_security_rate_limit(text, text, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.clear_security_rate_limit(text, text) from public, anon, authenticated;
grant execute on function public.consume_security_rate_limit(text, text, integer, integer, integer) to service_role;
grant execute on function public.clear_security_rate_limit(text, text) to service_role;

commit;
