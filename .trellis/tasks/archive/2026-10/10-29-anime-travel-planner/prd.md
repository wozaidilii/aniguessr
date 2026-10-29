# Anime travel planner and route discovery

## Goal
Turn the existing anime pilgrimage catalog into useful, editable travel itineraries. Support selecting multiple anime/places and discovering anime locations along an existing trip, with ordinary attractions, food, hot springs and Klook links.

## Requirements
- New branch `codex/anime-travel-planner`; standalone localized `/pilgrimage/planner` entry in navigation and contextual links from work, area and spot pages.
- Two modes: plan from selected anime/spots; discover along an ordered route of cities/places.
- Search existing multilingual catalog; reuse favorite anime. Curated starter routes and destination hubs make the feature usable without prior selection.
- Days, pace, transport, starting date and interests; geographic ordering, editable stop order, daily time budgets, visible overflow/unrealistic-transfer warnings.
- Route overview map; daily schedules and individual-leg Google Maps navigation.
- Curated ordinary attractions/food/onsen with verified official reference links. Nearby discovery supplements regions without curated coverage.
- Klook destination/activity links using existing affiliate settings when enabled; public destination fallback when disabled. Never expose server configuration to the browser.
- Local draft persistence, copyable share URLs, portable text download and print. Guard malformed/oversized state and storage/network failure.
- Japanese, English, simplified and traditional Chinese; responsive keyboard-accessible UI.
- Distances and durations are planning estimates, not live routing, timetables, prices or opening-hours availability. Along-route discovery uses a geographic corridor and labels this explicitly. Do not invent popularity metrics.

## Acceptance Criteria
- [x] Multiple selected anime and explicit spots can produce a deterministic itinerary without duplicates or lost explicit selections.
- [x] Route anchors preserve user order; nearby discoveries are bounded by the selected corridor and can be added to the trip.
- [x] Scheduling handles long transfers and capacity overflow visibly; controls and reordering recalculate results.
- [x] Enrichment and Klook links work without account, database, paid APIs or affiliate credentials.
- [x] Draft/share round trips preserve settings and stop order; invalid inputs fail safely.
- [x] Lint, TypeScript, focused algorithm tests, production build, desktop/mobile smoke pass.

## Technical Approach / Decision
Reuse `NavCatalog`, existing search folding, localization, geodesic distance and MapLibre. Keep catalog fetch and all route calculations in the browser. Use a typed pure planning engine with bounded selections and a versioned validated state codec. Server builds a small map of public/tracked Klook URLs. No new runtime dependencies or database migration.

Alternatives considered: hosted routing/Places API (requires credentials, billing and live-service handling); LLM-only itinerary generation (unreliable coordinates and schedules). A deterministic geographic planner is immediately usable and leaves room for a later routing adapter.

## Out of Scope
Live transit schedules, automatic reservations/payments, hotel availability, account sync, pretending geometric paths are navigable roads.

## Authorization / Assumptions
User requested comprehensive implementation and a new branch. Proceed autonomously with both requested scenarios. Initial curated travel coverage focuses on Japan; the existing global anime catalog remains searchable.

## Research References
- `research/approach.md`
