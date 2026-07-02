# ReviewKok Flutter App

Flutter client for the Korean experience-campaign aggregator. It targets:

- web
- iOS
- Android

## Run

```bash
flutter pub get
flutter run -d chrome \
  --dart-define=SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

## Current implementation

- Campaign discovery list with search, platform/type/source/deadline filters
- Campaign detail screen with benefit, deadline, source, region, original link, and map search handoff
- Visit campaign map-list flow with external Kakao map search
- Local saved campaigns via `shared_preferences`
- Board placeholder that preserves the current IA while server-side write/auth APIs are migrated

## Migration notes

The old Next.js app combined UI and server routes. Flutter cannot safely expose service-role Supabase operations, password hashing, image proxying, or cookie-auth routes inside the client. Move those behaviors to Supabase Edge Functions or another backend before deleting `apps/web`.
