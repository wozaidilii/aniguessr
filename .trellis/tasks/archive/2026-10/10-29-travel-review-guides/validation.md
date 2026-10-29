# Validation — 2026-10-29

## Automated checks
- `SKIP_ENV_VALIDATION=1 npm run check`: passed (lint + TypeScript). Only pre-existing warnings in `home-account.tsx`, `affiliate/urls.ts` and `place-names.test.ts`.
- `SKIP_ENV_VALIDATION=1 npm test`: **493 passed, 4 failed; 107 files, 497 tests**. All changed/new behavior tests pass, including non-crossing ordering, monotonic travel estimates, explicit/automatic selection, serialization limits, entry semantics, guide matching/attribution, locale links and blocked storage reads. This adds 20 passing tests compared with the previous planner task.
- The four failures are unchanged from the untouched `f5cda70` baseline verified in the preceding task: Windows path separators (`locale-exempt`), Windows `spawnSync npx ENOENT` (`anitabi-page-html`), existing 豊島區/豐島區 expectation (`home-map-labels`), and fixed historical lastmod expectation versus current generated date (`pilgrimage-label-impact`). No assertions were weakened or skipped.
- `SKIP_ENV_VALIDATION=1 npm run build`: passed, all four locale planner routes generated; route size 41.2 kB / 179 kB first-load JS. No new package, database migration or secret required.
- `git diff --check`: passed. Restored build-only CSV line-ending noise.

## Real browser verification
Ran the full interaction and resilience scenarios in Chromium against development port 3218 and the final production build on port 3217.

- Shared two-day Shonan trip previews without overwriting a saved seven-day Tokyo/Kyoto trip. Language switch preserves the fragment and saved draft.
- Restore saved trip, undo, clear/undo, same-document hash navigation and browser Back restore the intended state.
- Copy guide list includes Klook and Odakyu attribution. Edit/copy the English forum question; exact dates and private URLs are omitted by the generator.
- Downloaded itinerary retains source URLs. Print shows guide cards and hides community controls.
- Desktop 1440×1050 and mobile 390×844 visually inspected; document width equals viewport width on mobile. No runtime errors in the interaction flow.
- Clipboard denial provides selectable text; changing the trip clears the stale fallback.
- Unknown context and invalid share preserve and display the existing draft.
- Catalog 503 shows retry and keeps settings disabled; retry recovers normally.
- Blocking the `window.localStorage` getter still allows shared-trip loading, editing and guide reading; persistence failure is reported instead of crashing the root telemetry component.
- Guide headings and pages render in `en`, `ja`, `zh-tw` and `zh`.

Local evidence (ignored diagnostic artifacts): `.cache/travel-review-check.log`, `.cache/travel-review-tests.log`, `.cache/travel-review-build.log`, `.cache/travel-review-production.log`, `.cache/travel-review-production-resilience.log`, and `output/playwright/travel-review-guides-{desktop,mobile}.png`. Export sample: `output/playwright/travel-review-export.txt`.

## Integration boundary
External guide URLs and the community entry were inspected from their original publishers; source details are in `research/integrations.md`. No licensed feed or authenticated community partnership is claimed. No outbound post, email, booking or account action was performed.
