# Validation — 2026-10-29

## Passing checks

- `SKIP_ENV_VALIDATION=1 npm run check`: ESLint and TypeScript pass. Existing warnings remain in `home-account.tsx`, `affiliate/urls.ts` and `place-names.test.ts`; no new planner warnings.
- `npm test -- src/lib/travel src/server/data/travel-klook.test.ts src/lib/site-nav.test.ts src/lib/same-place-groups.test.ts`: 27 tests in 5 files pass. Covers geographic corridors, date-line and repeated points, explicit selections, anchor order, single-origin ordering, exclusions, daily capacity and transfer accounting, state validation, share round trips, affiliate fallback, navigation and LF/CRLF CSV parsing.
- `SKIP_ENV_VALIDATION=1 npm run build`: production build, localized static planner pages, sitemap generation and frozen 404 shells pass.
- Real Chromium checks: select a starter route, add an anime discovery, edit a visit duration, reorder stops, plan two anime, restore a shared trip, preserve drafts across locales, download itinerary and print.
- Resilience checks: malformed shared data cannot overwrite the saved draft; catalog HTTP 503 presents a retry that restores the trip after recovery.
- Responsive checks: 390 × 844 mobile viewport has no horizontal overflow; desktop map and itinerary render. The map handles initial style loading and lifecycle replacement without throwing.
- Curated attractions reference official tourism/operator pages. Klook destination paths and Google Maps URL parameters were checked against their live pages/documentation.

## Full suite and compatibility fix

The final full `npm test` run reports 473 passing and 4 failing tests (477 total). All four failures also reproduce in an isolated extraction of the untouched starting commit `f5cda70` on this Windows host:

1. `src/lib/locale-exempt.test.ts`: Windows backslashes differ from expected forward slashes.
2. `scripts/lib/anitabi-page-html.test.mjs`: `spawnSync npx` returns `ENOENT` on Windows.
3. `scripts/lib/home-map-labels.test.mjs`: existing traditional Chinese label mismatch, 豊島區 / 豐島區.
4. `scripts/lib/pilgrimage-label-impact.test.mjs`: historic expected `lastmod` differs from the date of regenerated data.

These unrelated failures are recorded, not changed as part of the travel planner. Local reproduction logs are retained under ignored `.cache/travel-baseline-tests.*`.

The initial suite had a fifth baseline failure in `same-place-groups.test.ts`. Production integration exposed its practical impact: Windows CRLF checkouts made the CSV header parser reject the file, so opening a spot detail from a planned trip returned HTTP 500. The parser now accepts LF and CRLF; the committed-file comparison normalizes only line endings. Both newline variants have regression coverage and the existing same-place export test now passes without changing any CSV data.

After the fix, production spot-detail requests return HTTP 200 in all four locales, and the detail page's planner link correctly selects that exact spot in the itinerary.

Production browser checks also verified HTTP 200 and canonical metadata for all four planner locales, Klook links, no uncaught JavaScript errors and a 390px mobile viewport. Local Vercel analytics scripts return 404 outside Vercel; this is existing deployment-specific instrumentation.

## Known product boundaries

- Transport durations and corridor distances are geographic planning estimates, with visible warnings and per-leg navigation links for checking actual journeys.
- Curated additions initially cover selected Japanese destinations; arbitrary catalog locations still have nearby Google Maps searches and a Klook destination/general fallback.
- No live availability, booking, road routing, ticket price or opening-hours promise is made. No database or paid service credentials are required.
