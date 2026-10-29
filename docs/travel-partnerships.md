# Travel content and community partnerships

Reviewed 2026-10-29. This is a proposed integration brief and an **unsent** outreach draft. It does not represent an existing content license or partner agreement.

## Current capability
AniGuessr connects a catalog of 23,034 anime locations to itinerary planning in Simplified Chinese, Traditional Chinese, Japanese and English. Current content recommendations are 11 manually reviewed links with source, original language, region/topic coverage and review date. The itinerary, copied list and system share preserve attribution. Users choose the recipient in their own sharing application; there is no automatic email or newsletter service.

Existing Klook destination links can use the project's configured affiliate ID. Affiliate configuration alone does not grant article reproduction, translation, review scraping or API distribution rights.

## Verified entry points
| Organization / channel | Verified entry | Suitable next step |
| --- | --- | --- |
| Klook Affiliate Program | https://affiliate.klook.com/home | Apply as a travel publisher or use the official Contact Us route. The official affiliate search listing publishes `affiliate@klook.com`; re-check the program page before sending. Ask specifically for publisher/distribution and editorial content access. |
| Klook public API documentation | https://klook.gitbook.io/openapi/getting-started/integration-process | This is a supplier/reservation-system flow: the supplier provides endpoints and credentials to Klook. It does not establish an open consumer article feed. Request the integration appropriate to a recommendation website. |
| japan-guide.com community | https://www.japan-guide.com/forum/quedisplay.html | Users can sign in and ask itinerary questions through the forum. No public posting API or permission to republish responses was established. Keep current user-controlled handoff unless a formal integration is agreed. |
| Tourism bodies / operators | Original publisher links in `src/lib/travel/guides.ts` | Ask their published partnership contact about approved summaries, media, itinerary collections and refresh requirements. Do not infer a commercial relationship merely from linking to their public pages. |

## Proposed first pilot
Cover Tokyo, Kamakura/Enoshima, Hakone and Kyoto/Uji. Recommend publisher guides based on scheduled destinations and interests (anime, culture, food, onsen and transport). Keep editorial ranking independent of commission, and label paid booking links separately. Start with approved metadata and original links; add licensed excerpts or media only when granted.

Requested feed contract:
- Stable guide ID, canonical HTTPS URL, publisher/author, original language, region/coordinates, topic tags, title, reviewed/published/updated dates and retired/deleted status.
- Explicit permission for any summary, translation, image, cached copy, email excerpt or system-share content. Attribution format and source links must travel with the content.
- Refresh intervals, deletion/correction signals, rate limits, pricing, caching rules and locale fallback.
- Separate booking deep links and destination/product identifiers; no claim of current price or availability without timestamped provider data.
- A publisher-facing API or feed specification, sandbox credentials and allowed domains. Keep all secrets server-side; share only coarse destination/topic requests unless a separately agreed user-consent flow requires more.

Technical implementation after agreement: server-side adapter → strict validation of provider records/URLs → cached normalized guide records with provenance and expiry → existing regional recommendation interface → attributed cards/export/share. Expired or withdrawn records must fall back to curated links, not stale price claims. Add provider fixtures, malformed-record and outage tests before rollout.

## Delivery and conversation
1. **Available now:** source cards, original-site links, copy/download/print and native system sharing (with copy fallback). English community questions are editable and remain under user control.
2. **Optional licensed content feed:** depends on publisher rights and API credentials; it is distinct from a booking affiliate account.
3. **Automatic delivery:** requires an agreed channel (account inbox or subscribed email), verified recipients, consent/unsubscribe controls, delivery provider and a send review/rollback plan. No recipient list or messages are created by the current planner.
4. **Community dialogue:** requires a supported API and the user's forum identity/authorization. Do not simulate forum replies, expert endorsements or public posts. Responses would need source attribution and moderation before redistribution.

## Outreach draft for the site owner to review

**Subject:** AniGuessr — anime itinerary and destination-guide partnership inquiry

Hello Klook Partnerships team,

We operate AniGuessr, an anime-location discovery and itinerary planning website with a catalog of more than 23,000 locations and interfaces in Chinese, Traditional Chinese, Japanese and English. Travelers can combine anime locations with local sightseeing, food and onsen, then consult attributed destination guides and booking links.

We would like to discuss a pilot for Tokyo, Kamakura/Enoshima, Hakone and Kyoto/Uji. Could you advise which publisher or distribution program supports destination/activity deep links and access to approved editorial guide metadata? We would also like to understand any licensed excerpt/image permissions, attribution requirements, language coverage, feed refresh/deletion rules, API access and commercial terms.

Our recommendation ranking would remain based on itinerary relevance and source quality, with commercial booking links disclosed separately. We would not republish articles or automate community messages without explicit authorization. We can provide a product demonstration and technical integration requirements for your review.

Please direct us to the appropriate partner team and application process. The sender should add the verified website URL, company/contact details and any accurate audience information before sending this draft.

## Browser sharing reference
The Web Share API requires a secure context and user activation, and support varies by browser. A resolved promise is not proof that a message reached a recipient. Canceling the share sheet must not trigger a copy/send fallback. Reference: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share .
