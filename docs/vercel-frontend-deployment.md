# Vercel Frontend Deployment

## Root directory
- `apps/web`

## Required environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL=https://reviewers-ten.vercel.app`

## Why both anon and service role keys exist
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public campaign reads
- `SUPABASE_SERVICE_ROLE_KEY`: server-side visitor count writes and server-side exact-count reads

## Supabase schema step
Apply the latest `supabase_crawler_schema.sql` before deploying so the `site_daily_visitors` table exists.

## Recommended Vercel settings
- Framework preset: Next.js
- Root directory: `apps/web`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: leave default

## Current app routes
- `/` applicant-facing explore page
- `/campaign/[id]` detail page
- `/trust` trust model explanation page
- `/api/visit` daily/total visitor counter endpoint
