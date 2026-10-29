# Continued review and validation — 2026-10-29

## Resolved findings
1. **P1: private shared itinerary in telemetry URLs.** The page tracker captures `window.location.href`, while `sanitizePostHogUrl` returned query-less URLs unchanged and never removed trip fragments. Updated both the TypeScript sanitizer and the mirrored SDK before-send hook. Seven new table cases cover absolute/relative/query/fragment inputs, nested redirects and normal hash preservation. No credentials or telemetry provider settings changed.
2. **P2: no user control over daily grouping.** Added per-stop manual day boundaries with backward-compatible state defaults, cleanup on removal, reset, undo and overflow recovery. Cross-day transfer origin/time are retained and combined manual/budget boundaries advance exactly once.
3. **P2: discovery disappears on mode switch.** With explicit visits but no anchors, route mode previously used an empty corridor. It now falls back to the ordered visits. Also corrected omitted-frame counts for an explicitly selected anime anchor.
4. **P2: edited forum question disappears after itinerary changes.** The text remains visible, marked outdated. Users can regenerate it or manually update and confirm before copying; it cannot be silently represented as the current schedule.
5. **P2: late async clipboard results revive outdated text.** Added request revisions so old success/failure results cannot overwrite current feedback or fallback text after newer actions/trip changes.
6. **P3: export claims scheduled meals on empty days.** Export now includes the meal allowance only on days with scheduled visits, matching the UI.
7. **Product delivery gap.** Added user-initiated native sharing of attributed guide lists with no exact dates/private trip links. Unsupported/failed native sharing falls back to copy or selectable text; cancellation does nothing. No message is automatically sent and share completion is not claimed as delivery.

## Review passes
- Static/data-flow review: schema → plan → day cards/export/forum question; page URL → manual telemetry → SDK hook.
- Regression and development-browser review: old draft, day splitting, automatic overlap, transfer accounting, overflow/reset/undo, stale questions, share/cancel/failure paths and mobile layout.
- Production-browser review after the full quality gate: repeat the complete flow, load a shared trip with boundaries, and switch across ja/zh-tw/en/zh.

## Quality gate
- `SKIP_ENV_VALIDATION=1 npm run check`: passed, with only existing warnings in home-account, affiliate URLs and place-name tests.
- `SKIP_ENV_VALIDATION=1 npm test`: **507 passed, 4 failed (108 files / 511 tests)**; 14 added passing tests over the previous 493. The four failures remain the previously confirmed baseline: Windows public-path separators, Windows `spawnSync npx ENOENT`, 豊島區/豐島區 fixture mismatch, and fixed historical lastmod versus the current generated date. No tests were skipped or weakened.
- `SKIP_ENV_VALIDATION=1 npm run build`: passed; four locale planner routes, 42.2 kB route / 180 kB first load. No new dependency or database migration.
- `git diff --check`: passed; build-only CSV newline noise restored.
- Chromium production interaction flow: legacy draft normalization, manual split/save/share, carried transfer, reset/undo, one-day overflow and recovery, preserved question edits and explicit recheck, guide native share/cancel/copy/denied-clipboard/late-rejection paths, download, print, all four locales; no page runtime errors.
- Desktop 1440×1050 and mobile 390×844 visually inspected. Mobile document width equals viewport width. Native Web Share / clipboard success and error APIs were stubbed to exercise UI paths without sending any external message; actual OS-recipient delivery was not performed.

Ignored local evidence: `.cache/travel-review2-{check,tests,build,browser,production}.log`, `.cache/travel-review2-browser.txt`, `.cache/travel-review2-production.txt`, `output/playwright/travel-review2-{days-desktop,guides-mobile}.png` and `output/playwright/travel-review2-export.txt`.

## Partnership research and remaining limitations
See `docs/travel-partnerships.md`: official Klook affiliate entry, supplier API boundary, forum handoff, requested licensed feed contract and an unsent email draft. The sources were checked again on 2026-10-29. The source-backed guide catalog remains 11 links; no new content partnership, automatic article ingestion, authenticated forum connection or email subscription service is claimed.

Real public-transport timetables, opening hours, road/ferry routes, accommodation/budget planning and automatic guide freshness checks remain outside the current heuristic planner. Manual day boundaries improve user control without pretending to solve those constraints. Community text is held in the current component session, not a persistent multi-device message store.
