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

alter table public.sources enable row level security;
alter table public.source_policies enable row level security;
alter table public.categories enable row level security;
alter table public.regions enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_snapshots enable row level security;
alter table public.crawl_jobs enable row level security;
alter table public.crawl_errors enable row level security;
alter table public.site_daily_visitors enable row level security;

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
end $$;

insert into public.sources (
  name, slug, base_url, homepage_url, platform_type, crawl_method, priority, robots_url, terms_url, risk_level, notes
)
values
  ('리뷰노트', 'reviewnote', 'https://www.reviewnote.co.kr', 'https://www.reviewnote.co.kr', 'mixed', 'dynamic', 10, 'https://www.reviewnote.co.kr/robots.txt', null, 'pending', 'MVP 1차 핵심 타겟'),
  ('레뷰', 'revu', 'https://www.revu.net', 'https://www.revu.net', 'mixed', 'dynamic', 20, 'https://www.revu.net/robots.txt', null, 'pending', 'MVP 1차 핵심 타겟'),
  ('디너의여왕', 'dinnerqueen', 'https://dinnerqueen.net', 'https://dinnerqueen.net', 'mixed', 'static', 30, 'https://dinnerqueen.net/robots.txt', null, 'pending', 'MVP 1차 핵심 타겟'),
  ('미블', 'mrblog', 'https://www.mrblog.net', 'https://www.mrblog.net', 'mixed', 'dynamic', 40, 'https://www.mrblog.net/robots.txt', null, 'pending', 'MVP 1차 핵심 타겟'),
  ('포블로그', '4blog', 'https://4blog.net', 'https://4blog.net', 'blog', 'static', 50, 'https://4blog.net/robots.txt', null, 'pending', 'MVP 1차 핵심 타겟')
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

commit;
