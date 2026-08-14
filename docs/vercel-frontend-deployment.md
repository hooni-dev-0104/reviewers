# Vercel Frontend Deployment

Production project: `reviewers` (`prj_tLzC42DeU7sExm7r9x2HLywkkNXv`)

Production URL: `https://reviewkok.vercel.app`

## Root directory
- `apps/web`

## Required environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL=https://reviewkok.vercel.app`

## Why both anon and service role keys exist
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public campaign reads
- `SUPABASE_SERVICE_ROLE_KEY`: server-side visitor count writes and server-side exact-count reads

## Supabase schema step
Apply the checked-in Supabase migrations before deploying. Web authentication expects the service-only rate-limit RPCs, and public reads require explicit anon grants.

## Recommended Vercel settings
- Framework preset: Next.js
- Root directory: `apps/web`
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: leave default

## Current app routes
- `/` applicant-facing explore page
- `/campaign/[id]` detail page
- `/trust` trust model explanation page
- `/api/visit` daily/total visitor counter endpoint
- `/account`, `/saved`, `/reminders`, `/board` applicant account and community flows
- `/ops` service-only operations dashboard
