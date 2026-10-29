# Guide and community integrations — reviewed 2026-10-29

## Klook
- Official affiliate entry: https://affiliate.klook.com/home . The existing project adapter already supports tracked destination links when the affiliate feature and partner ID are configured.
- Public API documentation: https://klook.gitbook.io/openapi and https://klook.gitbook.io/openapi/getting-started/integration-process . This documentation describes supplier / reservation-system integration, including supplier-generated endpoints and keys, Klook testing and go-live coordination. It is not evidence of an open consumer blog/community API or a license to republish articles.
- Reviewed original editorial resources: https://www.klook.com/zh-TW/blog/tokyo-enoshima/ (page reports 2026-10-19 update), https://www.klook.com/zh-TW/blog/kyoto-uji-spots/ (page reports 2026-03-17 update). Link directly; display the actual Traditional Chinese article language and platform-editorial classification. No commission affects guide ranking.
- Another search result, `/zh-TW/blog/hakone-travel/`, contained a potentially stale attraction reference. It was not selected merely because its title/year looked current; use the maintained operator itinerary directory for Hakone instead.

## Tourism and editorial resources
- Odakyu's old English destination URL redirects to https://odakyu-global.com/destinations/enoshima-kamakura/ . Use the destination's current canonical URL.
- Hakone operator itinerary directory: https://www.hakonenavi.jp/international/en/course . This contains themed routes and navigation to transportation and onsen information.
- Japan-guide Tokyo itineraries: https://www.japan-guide.com/e/e3051.html ; anime/manga guide: https://www.japan-guide.com/e/e3052.html . These are distinct editorial reading resources.
- Japan-guide Kyoto itineraries: https://www.japan-guide.com/e/e3950.html .
- Japan-guide Osaka itineraries: https://www.japan-guide.com/e/e4028.html ; food: https://www.japan-guide.com/e/e4022.html . Do not use `e4000.html` as an Osaka overview: it is specifically Osaka Castle.
- Hida Takayama tourism: https://www.hida.jp/english/touristattractions/4001419/4000090.html . This is the Setogawa/white-wall district visitor page, not an anime-specific or complete Hida itinerary. Label it accurately.
- Dogo operator: https://dogo.jp/en/ . Links to bathing facilities, current access, visitor guidance and walking maps. Do not cache or repeat volatile prices/hours in the planner.

## Community interaction
- Verified forum: https://www.japan-guide.com/forum/quedisplay.html . Public page contains travel/food question categories, sign-in and an Ask a new question entry.
- No supported public posting/content API was established from the reviewed material. Product implementation prepares an editable English question and a direct forum link. Posting is performed by the user in the forum; no automated posting, messages, account creation or outreach is performed.
- Question draft omits exact travel dates, coordinates and share URLs. Users can add seasonal/budget/mobility context themselves before posting. Exported itinerary and copied guide list are user-controlled delivery mechanisms.

## Recommended partnership path
1. Use current source links and optional affiliate redirects now; retain provenance and per-guide verification dates.
2. Ask a prospective partner about licensed content/feed access, attribution, permissible excerpts, language coverage, refresh/deletion requirements and deep links. For bookable inventory, request the consumer/distribution integration contract suitable for this website rather than assuming the supplier API is appropriate.
3. Only after agreement and credentials, add a server-side feed adapter with strict schema validation, caching, source attribution and a curated fallback. Keep keys and user selections out of static browser bundles.
4. For automatic community conversations or notifications, first establish the supported API, user identity/consent and delivery channel. The current feature does not claim such a connection.

## Selection policy
Prefer identifiable tourism bodies/operators and established editorial teams; inspect the actual page's region and subject, not its search-result title alone. Include diverse providers and scheduled destinations, identify original language and commercial context, and treat a verification date as link/content inspection rather than a guarantee that every practical detail remains current. No copied article bodies, photos, forum posts, invented ratings or unsupported expert endorsements.
