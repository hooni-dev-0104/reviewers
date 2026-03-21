# UX and Information Architecture for Applicants

## Purpose
Design the applicant-facing experience so people can quickly decide whether a campaign is worth opening, saving, or skipping. This IA is grounded in the current public-source quality report and the active applicant audits for `4blog`, `reviewnote`, `dinnerqueen`, and `revu`.

## Source-quality constraints that shape the IA
The interface should be built around the weakest parts of the data, not the best-case rows.

| Source | What is strong | What is weak | IA implication |
| --- | --- | --- | --- |
| `4blog` | title, url, platform, type, benefit, deadline, slots | region coverage is only 13% | the UI must tolerate missing region and still support confident browsing |
| `reviewnote` | strong in the checked-in report | fallback mode can degrade region, deadline, and slots | the UI should show freshness / quality context, not assume every crawl is equally reliable |
| `dinnerqueen` | title, url, platform, type, region, slots | benefit, deadline, and summary are brittle | list cards need a clear “info incomplete” treatment so weak rows do not look equally trustworthy |
| `revu` | title, url, platform, type, region, benefit, deadline, slots | verification is auth-gated, summary can still be thin | the UI can treat it as structurally strong, but should still surface source freshness |

## Product principles for applicants
1. **Search first, browse second.** Applicants usually arrive with a category, region, or deadline in mind.
2. **Never hide uncertainty.** Missing region, unclear deadline, or thin summary should be visible in the card, not buried.
3. **Make trust explicit.** The source, last-checked time, and completeness level belong in the experience.
4. **Prefer progressive disclosure.** The list should answer “is this worth opening?”; the detail page should answer “is this worth applying to?”
5. **Avoid dead ends.** Every empty state should offer a better query, a softer filter, or a save/alert action.

## Core information architecture

### Primary surfaces
1. **Explore / campaign list**
   - default landing surface
   - supports search, filtering, sorting, and quick save
2. **Campaign detail**
   - deeper trust review, requirements, and apply actions
3. **Saved campaigns**
   - shortlist, reminders, and follow-up
4. **Alerts / deadlines**
   - expiring soon, new matches, and quality-warning updates

### Secondary surfaces
- **Source trust view**: explains where data came from and how complete it is
- **Help / glossary**: explains platform, type, deadline, and review badges

## Recommended navigation model
Keep the shell shallow and task-oriented:

- **Explore** — main feed and search
- **Saved** — shortlist and reminders
- **Alerts** — deadline and match notifications
- **Trust** — source quality and freshness explanation

Avoid deep category trees in the main nav. Categories and regions should live in filters, not as the primary browse structure.

## User journeys

### 1) Quick scan and apply-or-skip
1. User opens Explore.
2. Search defaults to a broad feed sorted by relevance + urgency.
3. User scans cards using title, benefit, deadline, platform, and trust badge.
4. User opens one or two details.
5. User saves, sets a reminder, or leaves.

**Design need:** list cards must be decisive enough that applicants do not need to open everything.

### 2) Filtered discovery for a specific need
1. User searches a keyword or brand.
2. User narrows by platform, type, region, deadline, and source.
3. User sees which filters are too restrictive via empty-state guidance.
4. User relaxes one filter or switches to “show nearby matches.”

**Design need:** filters should be additive and recoverable, with visible active chips.

### 3) Trust review before applying
1. User opens a detail page.
2. User checks source freshness, deadline certainty, and missing fields.
3. User reviews mission, benefit, and application steps.
4. User copies the source link or proceeds to apply.

**Design need:** trust metadata must sit next to the apply CTA, not in a hidden footer.

### 4) Return visit through saved items
1. User opens Saved.
2. Stale, expiring, or low-confidence items are grouped first.
3. User revisits the most urgent items without re-running search.

**Design need:** saved items should age visibly and surface when the source last changed.

## Search and filter model

### Global search
Search should work across:
- title
- benefit text
- category keywords
- region
- platform
- source name
- tags / brand / venue terms

### Primary filters
Use a compact filter bar with chips and a slide-over or drawer for advanced controls.

- **Platform**: blog, instagram, youtube, mixed
- **Type**: visit, delivery, content, purchase, etc.
- **Region**: metro / province / local area, plus an explicit “region unknown” state
- **Deadline**: ending today, 3 days, 7 days, this month
- **Slots**: open, limited, low-count
- **Source trust**: high-confidence, needs review, auth-gated, fallback-quality
- **Sort**: urgency, newest, most complete, closest match

### Filter behavior rules
- Active filters should appear as removable chips.
- If a source lacks a field, that field should not disappear silently; it should map to a visible “unknown” bucket.
- Region filters should include a **remote / location-light** option for rows like `4blog` that often lack region coverage.
- Sorting should favor **urgency first**, then **data confidence**, then **freshness** when the user has not chosen a specific ordering.

## List page behavior

### Card anatomy
Each campaign card should include:
- title
- source / platform badge
- primary benefit
- deadline and slot count
- region or a visible “지역 미상” label
- trust/completeness indicator
- save action

### Visual hierarchy
1. Title and urgency
2. Benefit value
3. Deadline / slots
4. Region and source trust

### Card interactions
- entire card opens detail
- save button does not navigate
- hover / focus state reveals a quick actions row
- selected / saved cards are visually distinct but not overpowering

### List-level trust cues
- show last checked time or freshness window
- show a compact completeness badge, such as “정보 완전”, “정보 보강 필요”, or “검증 필요”
- if a row comes from a lower-quality source mode, show that plainly instead of reducing confidence through layout alone

## Detail page behavior

### Detail page structure
- **Hero section**: title, source, benefit, deadline, slots, region
- **Decision panel**: save, set reminder, open source/apply link
- **Trust panel**: last checked, field completeness, source note, original URL
- **Mission / summary**: human-readable summary with line clamp and expansion
- **Requirements**: list of actions, rules, and caveats
- **Related campaigns**: optional later-stage module

### Detail page rules
- Apply CTA should stay visible on desktop and accessible on mobile.
- Missing fields should appear as explicit placeholders, not empty whitespace.
- If deadline or region is uncertain, the detail page should say so in plain language.
- The raw source link must be discoverable for verification.

## Empty, error, and degraded states

### Empty search results
Show:
- a short reason why the current filters returned nothing
- one-click suggestions to broaden region, deadline, or source trust
- a fallback “show similar campaigns” action

### Missing-field state
If key fields are missing:
- keep the card renderable
- label what is unknown
- avoid collapsing the item into a generic skeleton once data has loaded

### Source degraded / fallback state
If a source is known to be unstable or lower-confidence:
- mark the source row with a visible warning badge
- keep the item accessible, but reduce the visual prominence of the CTA until the user opens detail
- provide a source-quality explanation rather than hiding the row

### No saved items
Use a friendly but useful empty state:
- explain what saving does
- offer a quick return to Explore
- suggest starting with filters that match recent activity

## Trust signals to surface everywhere
- source name and slug
- freshness / last checked time
- completeness badge
- deadline certainty
- direct source link
- review or fallback warning when applicable
- save / reminder status

## Interaction recommendations
- Keep the filter bar sticky on scroll.
- Use keyboard-accessible chips and drawers.
- Make save, reminder, and share actions low-friction and undoable.
- Preserve search terms and filters in the URL for sharability.
- Use skeletons only during loading; once data arrives, switch to explicit quality labels.
- On mobile, stack the trust panel above the fold-sensitive content so applicants do not miss it.

## Practical IA decisions from the audit
- Because `4blog` frequently lacks region, the UX should support **regional search without assuming every row is geocoded**.
- Because `dinnerqueen` can be weak on benefit and deadline, the card must make incomplete data obvious before click-through.
- Because `reviewnote` quality can shift by mode, the UI should explain freshness and confidence instead of treating every item as equal.
- Because `revu` is structurally strong but auth-gated in verification, the IA should keep a source-trust layer ready for future expansion.

## Suggested MVP sitemap
- `/explore`
- `/campaign/[id]`
- `/saved`
- `/alerts`
- `/trust`

## Recommended next-step interaction model
For MVP, the best default is a **search-led list with compact cards and a rich detail drawer/page**. That gives applicants one fast scanning surface and one trust-review surface, which matches the current quality profile better than a deeply nested browse taxonomy.
