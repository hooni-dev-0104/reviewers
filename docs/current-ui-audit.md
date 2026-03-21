# Current UI Audit and Refresh Notes

_Date: 2026-03-21_

## Problems identified

1. **Result comprehension was inconsistent**
   - Users could see campaign cards, but not always understand why they were seeing that specific list.
   - Active filters were not summarized clearly.

2. **Information hierarchy was too flat**
   - Hero, stats, filters, and card grid all competed for attention.
   - Detail pages lacked a strong separation between decision data and supporting context.

3. **Repeated-user flow was weak**
   - There was no lightweight shortlist flow for people comparing multiple campaigns.

4. **Visual consistency across surfaces was incomplete**
   - Explore, detail, trust, and saved experiences did not yet share enough consistent framing and guidance.

5. **Card density could reduce clarity**
   - Long benefit text and dense snippets made the feed feel heavy.

## Changes shipped

- Added a saved campaign flow with `/saved`
- Added active filter/result summaries on the list page
- Improved related-campaign context on detail pages
- Limited the default list to active campaigns only
- Removed the intentionally excluded MrBlog source from the live source filter
- Tightened card text handling to reduce visual overload

## Next recommended UX/UI improvements

1. Make filter/search guidance even more explicit near the top of the feed
2. Add stronger card-level visual grouping for urgency vs reward vs trust
3. Add mobile-first spacing polish and more consistent compact states
4. Introduce explicit archive mode later rather than mixing expired campaigns into the default feed
