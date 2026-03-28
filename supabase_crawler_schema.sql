begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  base_url text not null,
  homepage_url text,
  platform_type text not null default 'mixed' check (platform_type in ('blog','instagram','youtube','mixed','etc')),
  crawl_method text not null default 'manual' check (crawl_method in ('manual','static','dynamic','hybrid')),
  is_active boolean not null default true,
  priority integer not null default 100,
  robots_url text,
  robots_checked_at timestamptz,
  terms_url text,
  terms_checked_at timestamptz,
  risk_level text not null default 'pending' check (risk_level in ('low','medium','high','blocked','pending')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint sources_name_key unique (name),
  constraint sources_slug_key unique (slug),
  constraint sources_base_url_key unique (base_url)
);

create table if not exists public.source_policies (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  login_required boolean not null default false,
  robots_allowed boolean,
  excerpt_allowed boolean,
  image_allowed boolean,
  rate_limit_note text,
  policy_status text not null default 'pending' check (policy_status in ('allowed','restricted','pending','blocked')),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint source_policies_source_id_key unique (source_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint categories_slug_key unique (slug)
);

create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  parent_id uuid references public.regions(id) on delete set null,
  region_level integer not null default 1 check (region_level between 1 and 3),
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint regions_slug_key unique (slug)
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete restrict,
  source_campaign_id text,
  title text not null,
  category_id uuid references public.categories(id) on delete set null,
  category_name text,
  subcategory_name text,
  platform_type text not null default 'blog' check (platform_type in ('blog','instagram','youtube','tiktok','mixed','etc')),
  campaign_type text not null default 'visit' check (campaign_type in ('visit','delivery','purchase','content','mixed','etc')),
  region_primary_id uuid references public.regions(id) on delete set null,
  region_secondary_id uuid references public.regions(id) on delete set null,
  region_primary_name text,
  region_secondary_name text,
  exact_location text,
  latitude double precision,
  longitude double precision,
  benefit_text text,
  recruit_count integer,
  apply_deadline timestamptz,
  published_at timestamptz,
  original_url text not null,
  thumbnail_url text,
  snippet text,
  raw_status text,
  status text not null default 'active' check (status in ('active','expired','removed','hidden','draft')),
  requires_review boolean not null default false,
  first_seen_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint campaigns_source_original_url_key unique (source_id, original_url)
);

create table if not exists public.campaign_snapshots (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  title text,
  benefit_text text,
  apply_deadline timestamptz,
  status text,
  raw_payload jsonb not null default '{}'::jsonb,
  crawled_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.crawl_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources(id) on delete set null,
  job_status text not null default 'queued' check (job_status in ('queued','running','success','failed','partial','cancelled')),
  started_at timestamptz,
  finished_at timestamptz,
  fetched_count integer not null default 0,
  inserted_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  failed_count integer not null default 0,
  error_summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.crawl_errors (
  id uuid primary key default gen_random_uuid(),
  crawl_job_id uuid references public.crawl_jobs(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  original_url text,
  error_type text,
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.site_daily_visitors (
  id uuid primary key default gen_random_uuid(),
  visit_date date not null,
  visitor_id text not null,
  path text not null default '/',
  created_at timestamptz not null default timezone('utc', now()),
  constraint site_daily_visitors_visit_date_visitor_id_key unique (visit_date, visitor_id)
);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  password_hash text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_saved_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint user_saved_campaigns_user_campaign_key unique (user_id, campaign_id)
);

create table if not exists public.reminder_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  remind_before_hours integer not null default 24 check (remind_before_hours in (3, 24, 72)),
  is_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reminder_subscriptions_user_campaign_key unique (user_id, campaign_id)
);

create table if not exists public.board_posts (
  id uuid primary key default gen_random_uuid(),
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  nickname text not null,
  title text not null,
  body text not null,
  password_hash text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint board_posts_private_requires_password check (
    (visibility = 'public' and password_hash is null)
    or (visibility = 'private' and password_hash is not null)
  )
);

create table if not exists public.ops_access_keys (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  passcode_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sponsor_slots (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null,
  title text not null,
  body text,
  cta_label text,
  cta_url text,
  is_active boolean not null default false,
  priority integer not null default 100,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.campaigns
  add column if not exists exact_location text;

alter table public.campaigns
  add column if not exists latitude double precision;

alter table public.campaigns
  add column if not exists longitude double precision;

create index if not exists idx_sources_is_active on public.sources (is_active, priority);
create index if not exists idx_campaigns_source_id on public.campaigns (source_id);
create index if not exists idx_campaigns_status on public.campaigns (status);
create index if not exists idx_campaigns_category_id on public.campaigns (category_id);
create index if not exists idx_campaigns_platform_type on public.campaigns (platform_type);
create index if not exists idx_campaigns_campaign_type on public.campaigns (campaign_type);
create index if not exists idx_campaigns_region_primary_id on public.campaigns (region_primary_id);
create index if not exists idx_campaigns_region_secondary_id on public.campaigns (region_secondary_id);
create index if not exists idx_campaigns_apply_deadline on public.campaigns (apply_deadline);
create index if not exists idx_campaigns_last_seen_at on public.campaigns (last_seen_at desc);
create index if not exists idx_campaign_snapshots_campaign_id_crawled_at on public.campaign_snapshots (campaign_id, crawled_at desc);
create index if not exists idx_crawl_jobs_source_id_created_at on public.crawl_jobs (source_id, created_at desc);
create index if not exists idx_crawl_errors_source_id_created_at on public.crawl_errors (source_id, created_at desc);
create index if not exists idx_campaigns_title_fts on public.campaigns using gin (to_tsvector('simple', coalesce(title,'')));
create index if not exists idx_site_daily_visitors_visit_date on public.site_daily_visitors (visit_date desc);
create index if not exists idx_user_sessions_user_id on public.user_sessions (user_id);
create index if not exists idx_user_sessions_expires_at on public.user_sessions (expires_at);
create index if not exists idx_user_saved_campaigns_user_id on public.user_saved_campaigns (user_id, created_at desc);
create index if not exists idx_reminder_subscriptions_user_id on public.reminder_subscriptions (user_id, created_at desc);
create index if not exists idx_board_posts_visibility_created_at on public.board_posts (visibility, created_at desc);
create index if not exists idx_board_posts_is_deleted_created_at on public.board_posts (is_deleted, created_at desc);
create index if not exists idx_ops_access_keys_is_active on public.ops_access_keys (is_active, updated_at desc);
create index if not exists idx_sponsor_slots_slot_key on public.sponsor_slots (slot_key, is_active, priority);

create or replace trigger trg_sources_updated_at
before update on public.sources
for each row execute function public.set_updated_at();

create or replace trigger trg_source_policies_updated_at
before update on public.source_policies
for each row execute function public.set_updated_at();

create or replace trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create or replace trigger trg_regions_updated_at
before update on public.regions
for each row execute function public.set_updated_at();

create or replace trigger trg_campaigns_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

create or replace trigger trg_reminder_subscriptions_updated_at
before update on public.reminder_subscriptions
for each row execute function public.set_updated_at();

create or replace trigger trg_board_posts_updated_at
before update on public.board_posts
for each row execute function public.set_updated_at();

create or replace trigger trg_ops_access_keys_updated_at
before update on public.ops_access_keys
for each row execute function public.set_updated_at();

create or replace trigger trg_sponsor_slots_updated_at
before update on public.sponsor_slots
for each row execute function public.set_updated_at();

alter table public.sources enable row level security;
alter table public.source_policies enable row level security;
alter table public.categories enable row level security;
alter table public.regions enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_snapshots enable row level security;
alter table public.crawl_jobs enable row level security;
alter table public.crawl_errors enable row level security;
alter table public.site_daily_visitors enable row level security;
alter table public.app_users enable row level security;
alter table public.user_sessions enable row level security;
alter table public.user_saved_campaigns enable row level security;
alter table public.reminder_subscriptions enable row level security;
alter table public.board_posts enable row level security;
alter table public.ops_access_keys enable row level security;
alter table public.sponsor_slots enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='sources' and policyname='Public read sources'
  ) then
    create policy "Public read sources" on public.sources for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='categories' and policyname='Public read categories'
  ) then
    create policy "Public read categories" on public.categories for select using (is_active = true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='regions' and policyname='Public read regions'
  ) then
    create policy "Public read regions" on public.regions for select using (is_active = true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='campaigns' and policyname='Public read visible campaigns'
  ) then
    create policy "Public read visible campaigns" on public.campaigns for select using (status in ('active','expired'));
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='site_daily_visitors' and policyname='Service role write visitor counts only'
  ) then
    create policy "Service role write visitor counts only" on public.site_daily_visitors for all using (false) with check (false);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='app_users' and policyname='Service role only app users'
  ) then
    create policy "Service role only app users" on public.app_users for all using (false) with check (false);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_sessions' and policyname='Service role only user sessions'
  ) then
    create policy "Service role only user sessions" on public.user_sessions for all using (false) with check (false);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_saved_campaigns' and policyname='Service role only user saves'
  ) then
    create policy "Service role only user saves" on public.user_saved_campaigns for all using (false) with check (false);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reminder_subscriptions' and policyname='Service role only reminders'
  ) then
    create policy "Service role only reminders" on public.reminder_subscriptions for all using (false) with check (false);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='board_posts' and policyname='Service role only board posts'
  ) then
    create policy "Service role only board posts" on public.board_posts for all using (false) with check (false);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='ops_access_keys' and policyname='Service role only ops access keys'
  ) then
    create policy "Service role only ops access keys" on public.ops_access_keys for all using (false) with check (false);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='sponsor_slots' and policyname='Public read active sponsor slots'
  ) then
    create policy "Public read active sponsor slots" on public.sponsor_slots for select using (is_active = true);
  end if;
end $$;

insert into public.sources (
  name, slug, base_url, homepage_url, platform_type, crawl_method, priority, robots_url, terms_url, risk_level, notes
)
values
  ('리뷰노트', 'reviewnote', 'https://www.reviewnote.co.kr', 'https://www.reviewnote.co.kr', 'mixed', 'dynamic', 10, 'https://www.reviewnote.co.kr/robots.txt', null, 'pending', 'MVP 1차 핵심 타겟'),
  ('레뷰', 'revu', 'https://www.revu.net', 'https://www.revu.net', 'mixed', 'dynamic', 20, 'https://www.revu.net/robots.txt', null, 'pending', 'MVP 1차 핵심 타겟'),
  ('디너의여왕', 'dinnerqueen', 'https://dinnerqueen.net', 'https://dinnerqueen.net', 'mixed', 'static', 30, 'https://dinnerqueen.net/robots.txt', null, 'pending', 'MVP 1차 핵심 타겟'),
  ('미블', 'mrblog', 'https://www.mrblog.net', 'https://www.mrblog.net', 'mixed', 'dynamic', 40, 'https://www.mrblog.net/robots.txt', null, 'pending', 'MVP 1차 핵심 타겟'),
  ('포블로그', '4blog', 'https://4blog.net', 'https://4blog.net', 'blog', 'static', 50, 'https://4blog.net/robots.txt', null, 'pending', 'MVP 1차 핵심 타겟'),
  ('서울오빠', 'seouloppa', 'https://www.seoulouba.co.kr', 'https://www.seoulouba.co.kr/campaign/?qq=popular', 'mixed', 'static', 60, 'https://www.seoulouba.co.kr/robots.txt', null, 'pending', '후보 소스 1차 파서 구현'),
  ('링블', 'ringble', 'https://www.ringble.co.kr', 'https://www.ringble.co.kr/category.php?category=829', 'mixed', 'static', 65, null, null, 'pending', '후보 소스 1차 파서 구현'),
  ('강남맛집', 'gangnammatzip', 'https://xn--939au0g4vj8sq.net', 'https://강남맛집.net', 'mixed', 'static', 70, null, null, 'pending', '후보 소스 1차 파서 구현')
on conflict (slug) do update set
  name = excluded.name,
  base_url = excluded.base_url,
  homepage_url = excluded.homepage_url,
  platform_type = excluded.platform_type,
  crawl_method = excluded.crawl_method,
  priority = excluded.priority,
  robots_url = excluded.robots_url,
  notes = excluded.notes,
  updated_at = timezone('utc', now());

insert into public.categories (name, slug, sort_order)
values
  ('맛집', 'food', 10),
  ('카페', 'cafe', 20),
  ('뷰티', 'beauty', 30),
  ('숙박', 'stay', 40),
  ('문화·여가', 'culture-leisure', 50),
  ('생활', 'lifestyle', 60)
on conflict (slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

insert into public.regions (name, slug, region_level, sort_order)
values
  ('서울', 'seoul', 1, 10),
  ('경기', 'gyeonggi', 1, 20),
  ('인천', 'incheon', 1, 30),
  ('부산', 'busan', 1, 40),
  ('대구', 'daegu', 1, 50)
on conflict (slug) do update set
  name = excluded.name,
  region_level = excluded.region_level,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

insert into public.ops_access_keys (label, passcode_hash, is_active)
values
  (
    'primary-admin',
    '99ca1c31df7906a2a8ae434c16b24f4a:87099472f0cf254c26e2328190d5a5ed9e6adf354fc1830448e0ff36164df6cf6fdd8f356d7bf3dbe60de6596de185be22b9beea0c1864b65efeb57245391547',
    true
  )
on conflict (label) do update set
  passcode_hash = excluded.passcode_hash,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

commit;
