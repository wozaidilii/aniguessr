# Continued travel planner review: day control and safe handoff

## Goal
Continue the user's authorized iterative review of the existing branch. Fix newly reproduced planner defects and make professional reading/community handoff useful without pretending to have an authenticated partner integration.

## Findings and implementation decisions
- The scheduler packs visits until the daily budget is exhausted, with no way to start a new day intentionally. Add optional `dayBreakBefore` IDs (default empty for legacy version-1 drafts). Preserve route order, carry inter-day transfers, retain overflow, and allow undo/reset of manual day boundaries.
- Route mode uses an empty anchor list for discovery even when explicit visits remain after switching modes. Use the ordered visits as its corridor when there are no anchors.
- Omitted anime count treats a selected route anchor as omitted. Count against both explicit stops and anchors.
- Community text is hidden after every trip change. Preserve edited text, flag it as outdated, and require regeneration or explicit acknowledgment after manual review before copying. Do not publish messages.
- PostHog's manual page event uses `window.location.href`; its sanitizer only checks query parameters. Strip `#trip=...` from URL properties and the mirrored SDK before-send hook, including nested redirect URLs, while retaining ordinary navigation hashes and existing query rules.
- Prepare a concrete partner integration brief with verified Klook and forum entry links, desired data contract, delivery/rights requirements and an unsent outreach draft.
- Add user-initiated system sharing of attributed guide lists, falling back to copy/selectable text where Web Share is unavailable. Cancellation must not copy or send anything.

## Acceptance criteria
- [x] Existing drafts/share URLs parse; day boundaries round-trip and can be removed/reset/undone.
- [x] Forced and automatic day splits do not double-skip, lose stops or drop transfers; overflow is explicit.
- [x] Route discovery works without anchors; selected anchors are not reported as omitted.
- [x] Edited community questions remain visible with stale-state controls and no silent posting.
- [x] Both telemetry sanitizer paths remove trip fragments without regressing existing non-trip URLs.
- [x] Unit regressions, lint/typecheck, production build and desktop/mobile browser flows pass; baseline test failures remain documented.

## Scope boundary
No new paid service, database migration, external post/email or supplier account. True timetables, licensed live content and automatic delivery still require the appropriate provider contract. No user clarification blocks the reproducible fixes above.

## References
Existing travel planner spec and prior review at `.trellis/tasks/archive/2026-10/10-29-travel-review-guides/`. Continue inline using the repository's Trellis workflow and current `codex/anime-travel-planner` branch.

