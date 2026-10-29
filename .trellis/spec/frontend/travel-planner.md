# Anime Travel Planner

## 1. Scope / Trigger
Changes to `/[locale]/pilgrimage/planner`, `src/lib/travel`, `src/components/travel`, or the planner's Klook adapter.

## 2. Signatures
- `buildTripPlan(catalog: NavCatalog, state: TripState): TripPlan` is a pure browser-safe planner.
- `tripStateSchema` validates the version-1 draft before use. `parseTrip` and `tripFromHash` return null on invalid input.
- `getTravelKlookLinks(locale): KlookLinks` is server-only and serializes only final URLs and sponsored flags.
- Draft key: `aniguessr_travel_draft_v1`. Share fragment: `#trip=<percent-encoded JSON>`.
- Contextual entry query: `?anime=<canonical subject ID>`, `?spot=<spot ID>`, or `?area=<location slug>`.
- `resolveTripEntry(catalog, search, hash, savedRaw): TripEntry` separates previewing from persistence; `useTripDraft` owns lifecycle, undo and storage.
- `recommendGuides(plan, state, locale): GuideRecommendation[]` ranks the curated `TravelGuide` catalog. `exportGuideText` and `buildCommunityQuestion` are pure text builders; no outbound requests.

## 3. Contracts
- Reuse `loadNavCatalog`, multilingual search folding, `localizedSpotName`, favorite IDs, geodesic distance and the existing map style. Never send the raw SEO index to the client.
- Pages remain daily ISR, cookie-independent and localized in zh/zh-tw/ja/en. User selections load after hydration.
- A draft permits 8 anime, 60 explicit spots, 60 curated places, 12 ordered route anchors, 1–14 days, 1–50 km corridor radius, and 0–720 minutes per visit. Arrays and string sizes are bounded; normalized IDs are unique.
- `dayBreakBefore` is a bounded set of stop IDs, defaulting to `[]` when loading legacy version-1 drafts. A boundary starts the next day only after a scheduled visit; never double-advance when a manual break and the budget both trigger. Carry the transfer to the new day and show any overflow. Removal cleans up the boundary; reset/undo/share/export preserve the same day grouping.
- Anime mode suggests at most 6 spatially distinct visits per work within 50km of its local starting cluster. Deduplicate automatic frames against explicit same-work spots and anchors too. Explicit selected stops are not silently dropped or merged. Extra automatic frames, disappeared IDs and unscheduled stops are reported.
- Route mode preserves anchor order. Great-circle corridor proximity is geographic discovery, NOT a road/rail route or detour estimate. Label this in the UI.
- Route discovery falls back to ordered selected visits when there are no anchors. Selected anime anchors are included visits, not omitted frames.
- Daily budgets include 60 minutes for meals/rest. Carry transfers across day boundaries. A single impossible transfer must show over-budget status; never claim it fits. Transport estimates must be non-decreasing with distance; use cumulative urban/intercity segments rather than changing the entire leg's speed at a threshold.
- No hidden truncation of Google Maps waypoints: use per-leg direction URLs with origin/destination/travelmode.
- Shared/contextual trips are previews until edited or explicitly saved. Valid and invalid previews preserve the stored draft; invalid entries display the saved trip when available. Offer restore and 20-step in-session undo. Hash changes, Back and locale changes preserve these semantics. Attach hash listeners independently of one-time hydration guards.
- JSON is bounded to 32,000 characters and the encoded hash to 100,000; the schema must reject a state that cannot round-trip through both decoders. Removing a stop deletes its duration override and retains at most the latest 180 exclusions. Discovery additions use the same per-kind limits as the schema.
- Show retryable catalog errors. Catch storage and clipboard errors. Clear stale clipboard fallbacks after any trip/locale change. Clear stale entry URLs after edits/saves while retaining framework history metadata, and notify hash listeners. Planner language links preserve only the anime/spot/area query and trip fragment.
- Storage denial must not crash shared root components before the planner mounts. Keep both `window.localStorage` access and `getItem` inside the session reader's error boundary; test blocked getters as well as quota/write failures.
- Use `AFFILIATE_ENABLED=true` and a nonempty `KLOOK_AFFILIATE_ID` for tracked URLs. Otherwise use plain Klook destinations. The planner's curated destination map is separate from the legacy page allowlist; don't change that allowlist to enable planner links. Mark paid links sponsored and show disclosure.
- Curated places require localized names/descriptions, coordinates, approximate visit duration and a verified official source. No live price, opening-hours or availability claims without a live provider.
- Guide entries require canonical HTTPS URL, identifiable publisher, actual article language, source kind, region/topic coverage and `checkedAt`. Match scheduled destinations (not unscheduled visits), cover distinct regions before extra guides, return at most 8. Do not use commission in ranking. Print/download/copy preserve attribution. A checked link is not a guarantee of current prices/hours.
- Guide and Klook destination matching use explicit trusted coverage; never infer Japan from a rectangular latitude/longitude range. Uncovered destinations use global Klook and an honest no-guide state.
- Community handoff is an editable English draft plus a verified forum link. Do not automatically post or claim an authenticated content/API partnership. Omit exact dates, coordinates and private/promotional links from generated questions; edits remain local.
- Keep edited community text visible after an itinerary change. Mark it outdated and disable copying until the user regenerates or explicitly confirms their own update. Guide lists may use user-initiated Web Share; treat cancellation as a no-op and unsupported/failed sharing as copy/selectable-text fallback. Do not claim delivery from a resolved share promise. Ignore late clipboard/share results after a newer action or trip change.
- PostHog URL properties and its mirrored SDK `before_send` hook must strip `#trip=...`, including query-less URLs and nested redirects, while preserving ordinary `#game`/`#rank` hashes. A fragment's absence from HTTP requests does not prevent a browser analytics SDK from reading it.

## 4. Validation & Error Matrix
| Input/state | Behavior |
| --- | --- |
| Invalid version/date/range/oversized draft | Null parse; show error; keep existing local draft |
| Catalog unavailable | Localized retry button; do not replace draft |
| Unknown selected ID | Visible warning and removable selection |
| Too many visits for days | Explicit unscheduled list |
| Map WebGL/style failure | Itinerary and navigation remain usable |
| Storage/clipboard unavailable | Visible message; downloadable trip / selectable share link |
| Valid shared/contextual trip | Preview; saved draft unchanged until edit/save |
| No regional guide coverage | Explicit empty state; no unrelated Japan recommendations |

## 5. Good / Base / Bad Cases
- Good: select two works, adjust visit durations, review overflow, open individual transport legs, save/share the exact selections.
- Base: an ordered city route with nearby anime and curated suggestions for manual addition.
- Bad: inventing train times, labeling map lines as navigable roads, silently discarding selected places, or calling a distance-sorted list a guaranteed optimal route.

## 6. Tests Required
- Corridor endpoints, repeated points, date line; bounded nearby results; manual order; exclusions; selected ID retention.
- Day budget, carry-over transfer, impossible day warning, edited visit duration and unscheduled retention.
- Draft/share round trips, invalid dates/version/oversize; Klook enabled/disabled/missing-ID behavior.
- Browser: both modes, desktop/mobile overflow, save/share/download/print, invalid share protection and failed catalog retry.
- Monotonic estimate thresholds, explicit-frame proximity, remote automatic outliers, encoding expansion, removal at limits, guide region/interest filtering, foreign-country fallback and exported attribution.
- Browser: preview across locale changes; restore/undo/Back; editable community draft; clipboard failure; guide print/download parity.
- Shared session reader: SSR, denied storage getter/read, malformed session and valid legacy session. Browser: blocked storage still allows itinerary editing and reports persistence failure.
- Manual boundaries: legacy defaults, serialization, first-stop boundary, transfers, simultaneous budget/boundary trigger, overflow/reset/removal. Export free days must not claim scheduled meal allowances.
- Both telemetry sanitizers: private trip fragment with/without query, nested redirect, query-only and fragment-only values, ordinary hash preservation.
- Browser: manual-day undo/reset/export; stale community text and explicit review; native sharing/cancellation/fallback, delayed clipboard rejection and mobile layout.

## 7. Wrong vs Correct
Wrong: reuse a React `ready` flag to add a source immediately after recreating a MapLibre map.
Correct: reset readiness on creation and track the actual instance that fired `load` before adding layers. A stale React flag is not sufficient. Do not skip updates indefinitely while `isStyleLoaded()` is temporarily false during tile loading. Fit bounds only when the stop geometry/order changes, not when visit duration changes.

Wrong: overwrite the saved draft with defaults when a share URL cannot parse.
Correct: report invalid shared state and keep persistence disabled until a valid user edit.

Wrong: split a checked-in CSV on `\n` and compare the header without accounting for Windows CRLF.
Correct: accept `\r?\n` in the same-place parser and test both line endings. The planner links to spot details, so smoke-test these links as well as the planner itself; a successful static build does not exercise every on-demand spot page.

Wrong: enable auto-save as soon as a valid shared trip is loaded, or switch the whole trip leg to a faster speed after 80km.
Correct: treat inbound data as a preview until user action; estimate time as the sum of nonnegative distance segments so longer travel cannot become shorter.
