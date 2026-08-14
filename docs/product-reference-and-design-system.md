# ReviewKok Product References and Design System

_Reviewed: 2026-08-14_

## Research frame

ReviewKok is not another single-source campaign marketplace. It is a cross-source decision tool: a user should be able to compare benefit, deadline, location, competition, and data confidence before moving to the original provider. The references below are therefore used for interaction principles and failure patterns, not for visual copying.

## Reference comparison

| Product | Useful pattern | User friction or limit to avoid | ReviewKok interpretation |
| --- | --- | --- | --- |
| [REVU](https://apps.apple.com/kr/app/%EB%A0%88%EB%B7%B0-revu/id1447322012) | Today-open feed, media filters, nearby map, campaign notifications, community | A public review asks for a clearer peer board for difficult merchant experiences; the App Store also reports incomplete accessibility support | Keep map and urgency prominent, add a neutral community surface, and make every primary card a labelled semantic button |
| [리뷰노트](https://apps.apple.com/kr/app/%EB%A6%AC%EB%B7%B0%EB%85%B8%ED%8A%B8/id6478379551) | Fast campaign application and a strong single task focus | Reviews describe losing exploration momentum when application completion immediately redirects into “내 체험단” | After opening the original application, preserve the current list and offer separate save/reminder actions instead of forcing a new context |
| [디너의여왕](https://apps.apple.com/kr/app/%EB%94%94%EB%84%88%EC%9D%98%EC%97%AC%EC%99%95/id1059210501) | Food-first discovery, short-form channels, reward-oriented entry points | Reward and promotional modules can compete with the core decision information | Keep reward secondary to benefit, deadline, location, and source confidence |
| [리뷰플레이스](https://apps.apple.com/kr/app/%EB%A6%AC%EB%B7%B0%ED%94%8C%EB%A0%88%EC%9D%B4%EC%8A%A4/id6444688394) | Compact campaign catalogue and familiar application flow | Reviews mention list state and login context being lost after back navigation | Preserve filters, scroll context, and selected campaign state across detail and account transitions |
| [리뷰노마드](https://apps.apple.com/kr/app/%EB%A6%AC%EB%B7%B0%EB%85%B8%EB%A7%88%EB%93%9C/id6497169500) | Reviewer-focused workflow rather than advertiser-first navigation | Reviews request application-state tracking, wider filters, and useful browsing before search | Make the default feed useful, keep advanced filters recoverable, and evolve Saved into a deadline/work queue |
| [바이럴메이커](https://apps.apple.com/kr/app/%EB%B0%94%EC%9D%B4%EB%9F%B4%EB%A9%94%EC%9D%B4%EC%BB%A4-%EC%B2%B4%ED%97%98%EB%8B%A8-%ED%98%91%EC%B0%AC-%EB%A6%AC%EB%B7%B0/id6737120866) | Campaign-specific schedule and deadline reminders | A separate manual calendar becomes another maintenance task | Build reminders directly from campaign deadlines and show the source freshness next to the reminder |
| [4blog](https://4blog.net/) | Dense public listing and straightforward original-link handoff | Region coverage can be incomplete in aggregated data | Never hide missing location; show “지역 미상” or data-review status without blocking the item |
| [모두의체험단](https://modan.kr/campaigns) | Clear delivery/visit badges, deadline badge, application/recruit counts | A source redesign can invalidate route-specific aggregators | Prefer structured metadata and show last-seen/source confidence so parser drift is visible to users and operators |
| [Klook Experiences](https://www.klook.com/experiences/) | Location-led activity discovery and saved shortlist | Its purchase funnel is not the same as an external campaign application | Borrow only map/category scan patterns; keep ReviewKok’s original-source and uncertainty model explicit |
| [Airbnb Experiences](https://www.airbnb.com/experiences) | Image-led local discovery and clear host/context cues | Large visual cards can hide comparable structured facts | Use imagery as support, while benefit/deadline/trust remain text-first and comparable |
| [Meetup](https://www.meetup.com/) | Event schedule, community context, and return-to-event flow | Deep community hierarchy would overload an aggregator MVP | Keep one shallow board and campaign reminders; avoid category trees in primary navigation |

## ReviewKok product principles

1. **Decision before promotion** — title, benefit, deadline, location, recruitment, and trust must appear before sponsored or reward content.
2. **Uncertainty is a first-class state** — missing and stale fields receive explicit labels instead of blank space or false certainty.
3. **Source continuity** — the original provider is always visible, but leaving ReviewKok never destroys the current search, save, or reminder context.
4. **Deadline-aware shortlist** — a saved item is an actionable deadline queue, not merely a bookmark.
5. **One-handed recovery** — search, quick filters, save, back, and retry stay reachable on compact screens, with advanced controls disclosed progressively.
6. **Safe community** — public/private post state is obvious; password operations use the server boundary and never expose hashes or private bodies through public Supabase tables.
7. **No borrowed identity** — no reference product’s color, icon composition, illustration, or card treatment is reproduced. Patterns are translated into ReviewKok’s trust-first language.

## Design system

### Color roles

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| App canvas | `RkColor.paper` | `#F7F6F3` | Warm, low-glare page background |
| Surface | `RkColor.surface` | `#FFFFFF` | Cards, sheets, form fields |
| Primary action/trust | `RkColor.primary` | `#2B5FE3` | Main CTA, selected navigation, verified status |
| Urgency | `RkColor.danger` | `#DA3B33` | Today/expired risk only, never generic decoration |
| Success | `RkColor.success` | `#138A5E` | Saved/synced/available states |
| Caution | `RkColor.warning` | `#B26C12` | Missing data, private content, review needed |
| Primary text | `RkColor.ink900` | `#1B1A17` | Headings and decisive facts |
| Secondary text | `RkColor.ink500` | `#6B665D` | Metadata and helper copy |

Color is never the only signal. Every status uses a text label and, where useful, an icon.

### Spacing and shape

- Base rhythm: 8px.
- Compact exceptions: 4px for icon/label micro-spacing and 12px for controlled intermediate gaps.
- Layout tokens: `RkSpace.x1=4`, `x2=8`, `x3=12`, `x4=16`, `x5=24`, `x6=32`.
- Main card radius: 8px (`RkRadius.lg`); pills use a fully rounded radius only for short status labels.
- Tap targets remain at least 44×44 logical pixels even when visual icons are smaller.

### Typography hierarchy

1. Page title: short action-oriented statement, maximum two lines.
2. Campaign title: strongest card text, maximum two lines.
3. Benefit/deadline: structured decision facts, not paragraph prose.
4. Source/location/recruitment: compact metadata with plain-language missing states.
5. Helper/error copy: concise recovery instruction, never internal implementation language.

The release build uses the platform system family until a licensed Korean brand-font asset is selected and bundled. A font name must not be declared without the matching iOS/Android asset because that silently falls back and creates inconsistent metrics.

### Component contracts

- `CampaignCard`: one semantic open action; bookmark remains a separate labelled control.
- `StatusPill`: always label + tone, optional icon; urgency, trust, success, warning, sponsor, reward, neutral roles only.
- `SummaryTile`: one number or short fact with a supporting label; three-column desktop layout stacks on narrow screens.
- `FilterPanel`: search first, quick chips second, advanced filters behind one explicit toggle; preserves values across detail navigation.
- `EmptyPanel` and `ErrorPanel`: explain the current state and provide one direct recovery action.
- `Account`: shows session/sync state without displacing Explore; destructive logout/delete actions are visually separated.
- `Board`: private bodies never appear in the public list; unlock and delete are explicit server-mediated actions.

## Implemented and next verification

- Implemented: shared Flutter tokens, compact responsive filters, campaign-card semantics, result/map/review summary tiles, explicit trust and missing-data states.
- Mobile parity target: account session, server-synced saves, reminders, board create/unlock/delete, Android/iOS secure token storage.
- Verification: keyboard/VoiceOver/TalkBack labels, 320px narrow layout, text scale 200%, dark system contrast behavior, list state after detail/back, and error recovery with the network unavailable.
- UX audit priority: preserve Explore filter/scroll state across bottom-navigation changes before adding deeper navigation; use explicit semantic buttons for the brand/home action.
