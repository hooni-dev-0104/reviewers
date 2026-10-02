-- Review-only SQL proposal (#5, #6). Generate a migration via the Supabase CLI
-- after the CLI installation blocker is resolved. Never apply to production here.
begin;
create table if not exists public.ad_event_daily (
  event_date date not null,
  event_kind text not null check (event_kind in ('sponsor_impression', 'sponsor_click', 'campaign_outbound_click')),
  entity_id uuid not null,
  slot_key text not null,
  event_count bigint not null default 0 check (event_count >= 0),
  primary key (event_date, event_kind, entity_id, slot_key),
  check ((event_kind = 'campaign_outbound_click' and slot_key = 'campaign-detail') or
         (event_kind in ('sponsor_impression', 'sponsor_click') and slot_key = 'feed-inline'))
);
alter table public.ad_event_daily enable row level security;
revoke all on public.ad_event_daily from public, anon, authenticated;
grant select, insert, update, delete on public.ad_event_daily to service_role;
create policy ad_event_service_only on public.ad_event_daily to service_role using (true) with check (true);

create or replace function public.record_public_event(p_event text, p_entity_id uuid, p_slot text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare today_kst date := (statement_timestamp() at time zone 'Asia/Seoul')::date;
begin
  if p_event = 'campaign_outbound_click' and p_slot = 'campaign-detail' then
    if not exists (select 1 from public.campaigns where id = p_entity_id and status in ('active', 'expired')) then return false; end if;
  elsif p_event in ('sponsor_impression', 'sponsor_click') and p_slot = 'feed-inline' then
    if not exists (select 1 from public.sponsor_slots where id = p_entity_id and slot_key = p_slot and is_active
      and starts_at <= statement_timestamp() and ends_at > statement_timestamp() and starts_at < ends_at) then return false; end if;
  else return false;
  end if;
  insert into public.ad_event_daily(event_date, event_kind, entity_id, slot_key, event_count)
    values(today_kst, p_event, p_entity_id, p_slot, 1)
  on conflict (event_date, event_kind, entity_id, slot_key)
    do update set event_count = public.ad_event_daily.event_count + 1;
  return true;
end;
$$;
revoke all on function public.record_public_event(text, uuid, text) from public, anon, authenticated;
grant execute on function public.record_public_event(text, uuid, text) to service_role;

create or replace function public.ad_event_report(p_days integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare start_day date; end_day date; result jsonb;
begin
  if p_days not in (7, 30) then raise exception 'Unsupported report window'; end if;
  end_day := (statement_timestamp() at time zone 'Asia/Seoul')::date;
  start_day := end_day - (p_days - 1);
  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) into result from (
    select e.entity_id, e.slot_key,
      sum(e.event_count) filter (where event_kind = 'sponsor_impression') as impressions,
      sum(e.event_count) filter (where event_kind = 'sponsor_click') as clicks,
      sum(e.event_count) filter (where event_kind = 'campaign_outbound_click') as outbound
    from public.ad_event_daily e where event_date between start_day and end_day
    group by e.entity_id, e.slot_key order by e.slot_key, e.entity_id
  ) t;
  return jsonb_build_object('start', start_day, 'end', end_day, 'rows', result);
end;
$$;
revoke all on function public.ad_event_report(integer) from public, anon, authenticated;
grant execute on function public.ad_event_report(integer) to service_role;

-- Retention job must be scheduled and verified before enabling collection.
create or replace function public.purge_ad_events()
returns void language sql security invoker set search_path = '' as $$
  delete from public.ad_event_daily where event_date < (statement_timestamp() at time zone 'Asia/Seoul')::date - 89;
$$;
revoke all on function public.purge_ad_events() from public, anon, authenticated;
grant execute on function public.purge_ad_events() to service_role;
commit;
