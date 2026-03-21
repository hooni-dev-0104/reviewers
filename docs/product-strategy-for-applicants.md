# Product Strategy for Applicants

_Date: 2026-03-21_

## Executive summary

The campaign-applicant service should position itself as a **trust-first discovery layer for Korean campaign applicants**: a place where users can quickly find campaigns they can actually judge, not just scroll past. The core product job is to reduce wasted application effort by surfacing the fields that matter most at decision time—title, URL, platform, type, benefit, deadline, slots, and source confidence—while being explicit when a listing is incomplete or lower quality.

That strategy is grounded in the current audit results:

- `4blog` is strong on benefit, deadline, slots, and URLs, but weak on region coverage and sometimes noisy in title/summary cleanup.
- `reviewnote` is strong when the API-backed path is healthy, but fallback mode can collapse deadline quality.
- `dinnerqueen` is currently weak on benefit, deadline, and summary usefulness.
- `revu` is structurally strong on field fill-rate, but local verification is auth-gated and summary depth is still thin.

So the product should **optimize for confidence-aware discovery**, not pretend every source has equal data quality.

## Positioning

**Positioning statement:**

> The fastest way for applicants to find campaigns worth applying to, with clear trust signals and no hidden surprises.

### What makes this different

Most campaign listings products stop at aggregation. This one should make the applicant’s decision easier by showing:

1. **What the campaign is** — clear title, platform, type, and benefit.
2. **Whether it is worth trust** — source health, freshness, and explicit gaps.
3. **Whether it fits the applicant** — region, remote eligibility, deadline, and slot count when available.
4. **Whether the record is safe to act on** — direct URL and source-level dedupe keyed on `(source, original_url)`.

### Product promise

- Do not hide uncertainty behind a fake certainty score.
- Do not bury source quality issues.
- Do make useful comparisons faster than checking each source manually.

## Target personas and jobs-to-be-done

| Persona | What they are trying to do | Primary JTBD | Product implication |
| --- | --- | --- | --- |
| **Fast opportunist** | Scans many campaigns quickly and applies only to clear fits. | “Show me the campaigns that are easiest to qualify for and least likely to waste my time.” | Prioritize high-signal cards, quick filtering, and compact decision cues. |
| **Careful verifier** | Double-checks legitimacy, deadlines, and eligibility before applying. | “Help me avoid dead listings, missing info, or low-trust campaigns.” | Make freshness, source confidence, and missing-field warnings obvious. |
| **Repeat applicant / creator operator** | Applies often and wants a reliable shortlist. | “Help me build a stable workflow so I can track, compare, and return to good campaigns.” | Add save, compare, and reminder workflows only after the trust layer is strong. |

### Core JTBD by stage

1. **Discover**: Find campaigns matching platform, category, region, or benefit intent.
2. **Qualify**: Decide if the campaign is worth opening based on trust and field completeness.
3. **Act**: Jump to the canonical source URL and apply without ambiguity.
4. **Return**: Keep a shortlist and revisit campaigns before deadlines.

## Trust model

The product should treat trust as a **first-class user experience**, not a backend detail.

### Trust signals to expose

- **Source name and source health**: whether the listing comes from a stable, fully parsed source or a fallback path.
- **Field completeness**: show which important fields are present, partial, or missing.
- **Freshness**: surface when the data was last checked or when the source is known to degrade in fallback mode.
- **Direct canonical URL**: make it clear where the applicant will land.
- **Duplicate handling**: dedupe on source + URL, not on normalized title.
- **Remote / 재택 label**: represent remote eligibility explicitly instead of leaving region blank.

### Field confidence policy

Use field-level confidence rather than a single opaque score.

- **High confidence**: title, URL, platform, type, and benefit for `4blog`; most fields for `revu`; most fields for `reviewnote` when API-backed.
- **Conditional confidence**: region on `4blog`, deadline on `reviewnote` fallback, and summary quality on `dinnerqueen`.
- **Low confidence / review-needed**: any listing where deadlines are missing, region is blank without a remote label, or the source is known to degrade materially in fallback mode.

### Trust rules for the UI and product logic

- Never rank a low-confidence record above a high-confidence one by default.
- Never show a blank field without explaining whether it is genuinely unknown or simply unparsed.
- Never imply that a campaign is current if the source is stale or the record is review-required.
- Never let title-only matches drive dedupe or grouping.

## Source-quality constraints that shape the product

These are not edge cases; they should shape the product’s default behavior.

| Source | What is strong | What is weak | Product impact |
| --- | --- | --- | --- |
| `4blog` | benefit, deadline, slots, URL | region coverage, title/summary cleanup noise | Use for fast campaign scanning, but avoid overpromising location filtering. |
| `reviewnote` | API-backed completeness | fallback mode can lose deadlines and slots | Surface source-health warnings and treat fallback records carefully. |
| `dinnerqueen` | title, URL, region, slots | benefit, deadline, summary quality | Treat as useful inventory, but not as a high-trust decision source yet. |
| `revu` | broad field coverage | auth-gated local verification, thin summary depth | Good for MVP breadth, but still needs clear source identity and record confidence. |

### Strategic implication

The MVP must be designed for **uneven data quality across sources**. That means:

- user-facing filters should prefer fields with high coverage,
- the detail view should reveal uncertainty instead of hiding it,
- and the home experience should favor records with stronger trust signals.

### Operating thresholds

Use source quality as a product gate, not just an analysis note.

- Promote a campaign into default ranking only when title, URL, platform, and type are present and at least one of benefit, deadline, or slots is strong enough to support a decision.
- Allow region-based filtering only when the source’s region coverage is high or when the record is explicitly labeled `재택`/remote.
- Surface a review-needed badge whenever a source is known to degrade in fallback mode or when a critical field is missing.
- Treat source-specific weak spots as first-class product constraints: `4blog` region, `reviewnote` fallback deadline fidelity, `dinnerqueen` benefit/deadline depth, and `revu` summary thinness.
- Expand source coverage only after the product can explain uncertainty clearly enough that applicants do not have to infer it themselves.

## Feature priorities

### MVP: must ship first

1. **Trust-aware listing surface**
   - Cards with title, source, platform, type, benefit, deadline, slots, and a visible confidence state.
   - Explicit “missing” or “review-needed” states for weak fields.

2. **Search and filter on stable fields**
   - Search by title and keyword.
   - Filter by source, platform, type, benefit range, deadline proximity, and slot availability.
   - Region filtering only when the source’s region coverage is strong enough to be reliable.

3. **Detail page with applicant decision cues**
   - Canonical URL.
   - Source health and freshness.
   - Clear explanation of missing fields.
   - Clear remote / local labeling.

4. **Save / shortlist**
   - Allow applicants to keep a working set of campaigns they may apply to later.
   - This is more useful than social features early on because the product’s first value is decision support.

5. **Direct apply handoff**
   - Minimize friction between discovery and action.
   - The service should not trap the applicant in a separate workflow when the source is already strong enough to act on directly.

### Later: should wait until trust is established

1. Personalized recommendations.
2. Application reminders and deadline alerts.
3. Cross-source duplicate grouping by campaign identity.
4. Applicant history and outcome tracking.
5. Community features such as reviews or comments.
6. Monetized premium workflows that depend on reliable usage patterns.

## Monetization guardrails

Monetization must reinforce trust, not erode it.

### Allowed

- **Transparent sponsorships** that are clearly labeled and never disguised as organic ranking.
- **Premium productivity features** such as saved searches, reminders, and advanced filters, but only after the core discovery flow is dependable.
- **B2B or operator tooling** that sits outside the applicant’s decision path, such as source-quality dashboards or review workflows.

### Not allowed

- Pay-to-unlock basic campaign details.
- Pay-to-see the source URL.
- Pay-to-hide missing deadlines or weak trust signals.
- Sponsored placement that changes search semantics, dedupe behavior, or confidence labeling.
- Notification spam as a revenue tactic.
- Dark patterns that pressure applicants into applying to low-confidence listings.

### Guardrail principle

If a monetization idea makes the product less trustworthy for applicants, it does not belong in the MVP.

## MVP vs. later roadmap

### MVP scope

The MVP should focus on **decision-quality discovery**:

- aggregate the current source set,
- expose the most reliable applicant-facing fields,
- label uncertainty clearly,
- and support a shortlist workflow.

#### MVP success criteria

- Users can quickly tell whether a campaign is worth opening.
- The product is useful even when some sources have weak region or deadline coverage.
- Review-needed and fallback records are visible rather than silently degraded.
- Applicants can follow the canonical source link with confidence.

### Later roadmap

After the trust layer is stable, expand into:

1. **Better coverage for weak fields**
   - Improve region inference for `4blog`.
   - Restore deadline fidelity when `reviewnote` falls back.
   - Improve benefit/summary extraction for `dinnerqueen`.

2. **Decision support**
   - Alerts, reminders, and saved-search automation.
   - Compare campaigns side by side.
   - Personalized prioritization based on past behavior.

3. **Quality intelligence**
   - Source health scoring.
   - Coverage trend tracking.
   - Parser drift detection surfaced to operators.

4. **Growth**
   - Add more sources only after the current source mix is stable.
   - Expand into higher-variance sources once the trust model can explain degradation cleanly.

## Product principles

1. **Confidence over coverage**
   - A smaller set of trustworthy listings beats a larger set of misleading ones.

2. **Make gaps legible**
   - Missing data should be explained, not hidden.

3. **Directness beats ceremony**
   - Applicants want to decide and act, not manage a complicated workflow.

4. **Monetization follows trust**
   - Earn the right to charge after the discovery flow is already useful.

5. **Use quality to choose defaults**
   - High-confidence sources and fields should shape ranking, filtering, and product emphasis.

## Recommendation

Ship the applicant experience as a **trust-first campaign decision product**, not a generic listings feed. The immediate opportunity is to combine aggregation with confidence-aware presentation so applicants can act faster on the records that are actually usable today.
