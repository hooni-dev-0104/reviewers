# Korean Experience Campaign Aggregator MVP

Stdlib-first Python scaffold for a Korean experience-campaign crawler built around the current Supabase schema.

## What is included

- environment/config loading
- seeded source catalog for the 5 MVP sites
- normalized campaign dataclass model
- Supabase PostgREST client with campaign/job/error helpers
- dry-run friendly pipeline
- local file-backed source adapter for offline development
- placeholder seeded adapters for real sites
- Flutter applicant-facing app in `apps/flutter` for web, iOS, and Android
- Legacy Next.js frontend remains in `apps/web` during the migration window
- unit tests using `unittest`

## Seeded MVP sources

- 리뷰노트 (`reviewnote`)
- 레뷰 (`revu`)
- 디너의여왕 (`dinnerqueen`)
- 미블 (`mrblog`)
- 포블로그 (`4blog`)

## Quick start

1. Copy env template:

```bash
cp .env.example .env
```

2. Run tests:

```bash
python3 -m unittest discover -s tests -v
```

3. List seeded sources:

```bash
python3 -m crawler.cli list-sources
```

4. Dry-run a local sample payload:

```bash
python3 -m crawler.cli run-source reviewnote --source-file sample.json --dry-run
```

5. Run a scheduled refresh for all seeded sources:

```bash
python3 -m crawler.cli run-scheduled --all --write --delete-before-refresh
```

This mode is intended for cron / hourly / scheduled batch execution:
- it refreshes source-by-source
- it can delete the previous campaign rows for that source before re-inserting the latest rows
- it keeps `crawl_jobs` history, but removes the prior live `campaigns` rows for the source

6. Run a public-source quality report:

```bash
python3 -m crawler.cli run-report --all-public --output docs/public-source-quality-report.md
```

This runs a dry-run over the current public parser set and emits a markdown report.

## Flutter app (`apps/flutter`)

The primary applicant-facing client is now a Flutter app that targets web, iOS, and Android.

### Required Flutter env

```bash
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

### Local run

```bash
cd apps/flutter
flutter pub get
flutter run -d chrome \
  --dart-define=SUPABASE_URL=$SUPABASE_URL \
  --dart-define=SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
```

### Platform builds

```bash
cd apps/flutter
flutter build web --release \
  --dart-define=SUPABASE_URL=$SUPABASE_URL \
  --dart-define=SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
flutter build ios --release --no-codesign \
  --dart-define=SUPABASE_URL=$SUPABASE_URL \
  --dart-define=SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
flutter build apk --release \
  --dart-define=SUPABASE_URL=$SUPABASE_URL \
  --dart-define=SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
```

The Flutter app currently connects directly to Supabase public REST for campaign discovery and public board reads. Saved campaigns are stored locally per device. Account-backed saves, reminders, board writes/private unlocks/deletes, ops pages, image proxying, and server-only snapshot enrichment still require a backend replacement such as Supabase Edge Functions before the legacy Next.js API routes can be retired.

### Legacy Next.js app (`apps/web`)

The previous Vercel-ready Next.js app is still present for reference and for server/API behavior that has not yet moved to Flutter-safe backends.

```bash
cd apps/web
npm install
npm run dev
```

### GitHub Actions production deploy

A dedicated workflow now deploys the frontend to Vercel on every push to `main` when frontend files change.

Required GitHub secrets:

```bash
VERCEL_TOKEN=YOUR_VERCEL_TOKEN
VERCEL_ORG_ID=team_ZtzXXpuCkVLHkJ4c7RUR2FZr
VERCEL_PROJECT_ID=prj_YAHDuzPjm2Zx7qiQ0FlUVlSrf2be
```

The workflow file is `.github/workflows/vercel-production.yml`.

`sample.json` should be a JSON array of raw campaign objects. Example:

```json
[
  {
    "title": "서울 카페 체험단",
    "original_url": "https://example.com/campaign/1",
    "platform_type": "blog",
    "campaign_type": "visit",
    "category_name": "카페",
    "region_primary_name": "서울",
    "region_secondary_name": "강남",
    "benefit_text": "음료 2잔 제공",
    "apply_deadline": "2026-03-31T23:59:59+09:00"
  }
]
```

## Notes

- Real network scraping for the 5 seeded platforms is intentionally **not implemented** in this scaffold.
- Production writes require `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- The canonical upsert key follows the schema: `(source_id, original_url)`.
- The included GitHub Actions workflow is configured for an hourly-style schedule and calls `run-scheduled --all --write --delete-before-refresh`.
- The recommended current scheduled set is: `4blog`, `dinnerqueen`, `reviewnote`, and `revu` (auth-required).
- REVU can be authenticated with either `REVU_ACCESS_TOKEN` or `REVU_USERNAME` + `REVU_PASSWORD`.
