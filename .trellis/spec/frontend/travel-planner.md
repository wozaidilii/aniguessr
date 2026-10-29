# Anime Travel Planner

## 1. Scope / Trigger
Changes to `/[locale]/pilgrimage/planner`, `src/lib/travel`, `src/components/travel`, or the planner's Klook adapter.

## 2. Signatures
- `buildTripPlan(catalog: NavCatalog, state: TripState): TripPlan` is a pure browser-safe planner.
- `tripStateSchema` validates the version-1 draft before use. `parseTrip` and `tripFromHash` return null on invalid input.
- `getTravelKlookLinks(locale): KlookLinks` is server-only and serializes only final URLs and sponsored flags.
- Draft key: `aniguessr_travel_draft_v1`. Share fragment: `#trip=<percent-encoded JSON>`.
- Contextual entry query: `?anime=<canonical subject ID>`, `?spot=<spot ID>`, or `?area=<location slug>`.

## 3. Contracts
- Reuse `loadNavCatalog`, multilingual search folding, `localizedSpotName`, favorite IDs, geodesic distance and the existing map style. Never send the raw SEO index to the client.
- Pages remain daily ISR, cookie-independent and localized in zh/zh-tw/ja/en. User selections load after hydration.
- A draft permits 8 anime, 60 explicit spots, 60 curated places, 12 ordered route anchors, 1–14 days, 1–50 km corridor radius, and 0–720 minutes per visit. Arrays and string sizes are bounded; normalized IDs are unique.
- Anime mode suggests at most 6 spatially distinct visits per work. Explicit selected stops are not silently dropped or merged. Extra automatic frames, disappeared IDs and unscheduled stops are reported.
- Route mode preserves anchor order. Great-circle corridor proximity is geographic discovery, NOT a road/rail route or detour estimate. Label this in the UI.
- Daily budgets include 60 minutes for meals/rest. Carry transfers across day boundaries. A single impossible transfer must show over-budget status; never claim it fits.
- No hidden truncation of Google Maps waypoints: use per-leg direction URLs with origin/destination/travelmode.
- Preserve drafts on invalid shared input and show retryable catalog errors. Catch storage and clipboard errors. Clear stale context queries/shared fragments after edits.
- Use `AFFILIATE_ENABLED=true` and a nonempty `KLOOK_AFFILIATE_ID` for tracked URLs. Otherwise use plain Klook destinations. The planner's curated destination map is separate from the legacy page allowlist; don't change that allowlist to enable planner links. Mark paid links sponsored and show disclosure.
- Curated places require localized names/descriptions, coordinates, approximate visit duration and a verified official source. No live price, opening-hours or availability claims without a live provider.

## 4. Validation & Error Matrix
| Input/state | Behavior |
| --- | --- |
| Invalid version/date/range/oversized draft | Null parse; show error; keep existing local draft |
| Catalog unavailable | Localized retry button; do not replace draft |
| Unknown selected ID | Visible warning and removable selection |
| Too many visits for days | Explicit unscheduled list |
| Map WebGL/style failure | Itinerary and navigation remain usable |
| Storage/clipboard unavailable | Visible message; downloadable trip / selectable share link |

## 5. Good / Base / Bad Cases
- Good: select two works, adjust visit durations, review overflow, open individual transport legs, save/share the exact selections.
- Base: an ordered city route with nearby anime and curated suggestions for manual addition.
- Bad: inventing train times, labeling map lines as navigable roads, silently discarding selected places, or calling a distance-sorted list a guaranteed optimal route.

## 6. Tests Required
- Corridor endpoints, repeated points, date line; bounded nearby results; manual order; exclusions; selected ID retention.
- Day budget, carry-over transfer, impossible day warning, edited visit duration and unscheduled retention.
- Draft/share round trips, invalid dates/version/oversize; Klook enabled/disabled/missing-ID behavior.
- Browser: both modes, desktop/mobile overflow, save/share/download/print, invalid share protection and failed catalog retry.

## 7. Wrong vs Correct
Wrong: reuse a React `ready` flag to add a source immediately after recreating a MapLibre map.
Correct: reset readiness on creation and track the actual instance that fired `load` before adding layers. A stale React flag is not sufficient. Do not skip updates indefinitely while `isStyleLoaded()` is temporarily false during tile loading. Fit bounds only when the stop geometry/order changes, not when visit duration changes.

Wrong: overwrite the saved draft with defaults when a share URL cannot parse.
Correct: report invalid shared state and keep persistence disabled until a valid user edit.

Wrong: split a checked-in CSV on `\n` and compare the header without accounting for Windows CRLF.
Correct: accept `\r?\n` in the same-place parser and test both line endings. The planner links to spot details, so smoke-test these links as well as the planner itself; a successful static build does not exercise every on-demand spot page.
