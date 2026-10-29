# Review findings

1. **P1 — saved draft overwritten by preview**: hydration enables persistence for any valid shared/query trip, replacing the saved trip before user action. Invalid context also creates an empty or unknown draft. Fix with explicit entry-source semantics and restore/undo.
2. **P2 — non-monotonic estimates**: at 50km driving and 80km transit, switching the speed for the whole leg makes a longer trip much faster. Replace with cumulative urban/intercity segments; test threshold neighborhoods.
3. **P2 — redundant and remote auto visits**: frame spacing ignores explicitly chosen spots/anchors; automatic selection fills six slots even across remote locations. Seed proximity checks from explicit stops and constrain automatic picks to a local cluster without dropping explicit selections.
4. **P2 — inconsistent limits**: discovery additions use a combined 60-stop cap while the schema allows 60 of each kind; stale visit overrides and exclusions accumulate; a schema-valid long state can exceed the parser/share limits. Align limits and enforce serialization round trips.
5. **P2 — hash subscription lifecycle**: the hydration effect's early-return guard prevents reattaching the listener after effect cleanup. Separate initialization and event subscriptions.
6. **P2 — wrong destination attribution**: a rectangular Japan coordinate check includes Busan and other foreign places, producing Japan Klook recommendations. Match trusted destination coverage and use a global fallback outside it.
7. **Product gap — professional reading/community handoff**: existing recommendations contain curated places and booking destinations only. Add attributable regional guides and user-controlled community question drafts, with export parity.

Review loop: reproduce → focused fix/tests → inspect UI/data flow again → production/mobile/browser regression. Detailed final validation is recorded after implementation.

Second review pass found additional interaction gaps: locale links dropped a preview's fragment/query; browser Back to an empty fragment left the incoming preview visible; clipboard fallbacks could remain stale after Undo; transient map loading errors never cleared. These were corrected before browser regression.

Third pass exercised denied browser capabilities. A blocked `localStorage` getter crashed the entire page through the shared telemetry session reader, before the planner's own fallback could run. Moved the session read inside its existing error boundary and added regressions for blocked getters/reads, invalid sessions, SSR and valid legacy sessions. Planner persistence failures remain visible while planning, guide reading and export stay usable.

## Remaining product limits and next priorities
- **Real transport and feasibility:** geographic ordering/corridors are not road or rail routing. Transfers still need timetable, service-day, ferry, barrier/access and opening-hours checks. A future routing provider should return per-leg provenance, mode and timestamps, with the current estimate as a labeled fallback. Accommodation, admission costs and overall trip budgets are not modeled.
- **Coverage:** recommendations currently use 16 curated experiences and 11 guide links in selected Japanese regions. Other destinations retain anime discovery, map search and a global booking link; they do not receive invented local guide matches. Expand with verified regional records or a licensed provider feed.
- **Freshness and interaction:** guide checks are manual. No live article ingestion, community posting API, account connection, email delivery or notification subscription is configured. Current interaction is an editable, user-controlled handoff to a real travel forum, plus copy/export for sharing.
- **Persistence:** one browser draft and 20 in-session undo steps; no cloud sync or multi-trip library. A shared URL is readable by anyone who receives it. Add account-backed storage only with a separately defined access and privacy contract.

These limits are visible in product copy or documentation; none is represented as a live service. The reviewed defects above are resolved and the existing workflows remain usable without partner credentials.
