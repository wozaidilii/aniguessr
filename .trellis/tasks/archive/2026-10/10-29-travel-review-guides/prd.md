# Review travel planning and source-backed guide recommendations

## Goal
Review the existing planner, fix reproducible logic and usability defects through repeated verification, and recommend credible travel guides that users can read, share and discuss in relevant communities.

## Scope and decisions
- Continue the existing `codex/anime-travel-planner` branch. User explicitly authorizes autonomous review and improvements.
- Correct non-monotonic transport estimates, redundant automatic frames, remote automatic outliers, inconsistent selection/storage limits and destructive draft hydration.
- Preserve a saved draft when previewing a valid shared/contextual trip; support restoring it and undoing edits. Keep hash navigation functional through lifecycle/locale changes.
- Match Klook destinations using verified destination coverage instead of a Japan bounding box that includes neighboring countries.
- Add a curated guide catalog with verified source URLs, actual article language, topic/region coverage and verification dates. Rank by itinerary geography/interests and diversify sources/regions.
- Include recommendations in the UI and exported trip, with copy/shareable guide lists and an editable English question draft for a verified travel forum.
- Keep recommendations editorially selected, distinct from booking affiliate links. No fabricated ratings or expert endorsement, no article scraping/republication.
- Research Klook/community integration boundaries and document the practical partnership path. No account credentials are available; do not claim a live API/content partnership or publish messages to third parties.

## Acceptance criteria
- [x] Reviewed findings have reproducible tests or browser evidence and documented resolutions.
- [x] Travel estimates never decrease as distance grows; explicit choices remain visible and auto picks avoid duplicate/remote frames.
- [x] Opening a shared/contextual trip cannot overwrite the saved trip until the user edits/saves; restore/undo work; state/share limits round-trip safely.
- [x] Recommendations match only covered regions, disclose source and article language, and can be copied/exported.
- [x] Community question draft reflects the itinerary without silently publishing or including exact dates/private links.
- [x] Four locales, mobile/desktop, focused tests, lint/type check and production build pass; known baseline failures remain explicitly reported.

## Alternatives considered
1. Source-backed links and local matching (selected): useful without credentials; attributable and maintainable.
2. Licensed provider content/API: requires a suitable commercial agreement and documented distribution rights; preserve typed catalog boundaries for later ingestion.
3. Scrape/republish community content or automate posts: no verified integration contract, unnecessary for useful recommendations; excluded.

## Research
- `research/integrations.md` (verified sources and partnership boundaries).
- `review.md` (findings and verification).
- `validation.md` (final quality gate and browser evidence).
