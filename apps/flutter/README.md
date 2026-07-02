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

- App shell with Flutter named route entry points for `/`, `/map`, `/saved`, and `/board`
- Campaign discovery list with search, platform/type/source/deadline filters
- Campaign detail screen with benefit, deadline, source, region, original link, and map search handoff
- Visit campaign map-list flow with location summary and external Kakao map search
- Local saved campaigns via `shared_preferences`
- Board read flow with all/public/private filters and Supabase public list fetch

## Source layout

```text
lib/
  main.dart                  # entry point, env defines, app library parts
  src/app/                   # MaterialApp, route metadata, shell navigation
  src/core/                  # formatting and filter option constants
  src/data/                  # Supabase REST repositories and local stores
  src/domain/                # campaign, board, and filter models
  src/features/              # explore, map, saved, board, and campaign screens
  src/shared/widgets/        # reusable cards, chips, states, and list tiles
```

## Migration notes

The old Next.js app combined UI and server routes. Flutter cannot safely expose service-role Supabase operations, password hashing, image proxying, cookie-auth routes, or board write/delete behavior inside the client. Move those behaviors to Supabase Edge Functions or another backend before deleting `apps/web`.
