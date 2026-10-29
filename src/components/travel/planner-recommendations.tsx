"use client";

import { tripStopName } from "~/lib/travel/labels";
import { localizedNavText, type NavCatalog } from "~/lib/pilgrimage-nav";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { getTravelCopy } from "~/lib/travel/copy";
import { distanceKm, nearbySearchUrl } from "~/lib/travel/engine";
import { TRAVEL_HUBS } from "~/lib/travel/catalog";
import type { KlookLinks, TripPlan, TripStop } from "~/lib/travel/types";
import { StopLinks } from "./planner-itinerary";
import { capturePostHogEvent, POSTHOG_EVENTS } from "~/lib/posthog";

function regionFor(stop: TripStop): string {
  if (stop.klookRegion) return stop.klookRegion;
  const closest = TRAVEL_HUBS.filter((hub) => distanceKm(hub, stop) < 40).sort(
    (a, b) => distanceKm(a, stop) - distanceKm(b, stop),
  )[0];
  if (closest) return closest.klookRegion;
  return stop.lat >= 24 && stop.lat <= 46 && stop.lng >= 122 && stop.lng <= 146
    ? "japan"
    : "global";
}

export function PlannerRecommendations({
  plan,
  catalog,
  locale,
  klookLinks,
  onAdd,
}: {
  plan: TripPlan;
  catalog: NavCatalog;
  locale: PilgrimageLocale;
  klookLinks: KlookLinks;
  onAdd: (stop: TripStop) => void;
}) {
  const copy = getTravelCopy(locale);
  // Avoid sending the same district to external search repeatedly.
  const localStops: TripStop[] = [];
  for (const stop of plan.ordered) {
    if (!localStops.some((other) => distanceKm(other, stop) < 5))
      localStops.push(stop);
    if (localStops.length === 6) break;
  }
  const regions = [...new Set(plan.ordered.map(regionFor))];
  const hasSponsored = regions.some((region) => klookLinks[region]?.sponsored);
  return (
    <div className="trip-recommendations trip-no-print">
      <section className="trip-panel">
        <div className="trip-section-heading">
          <span className="trip-section-icon" aria-hidden="true">
            ✧
          </span>
          <h2>{copy.discovery}</h2>
        </div>
        <p className="trip-muted">{copy.discoveryHelp}</p>
        {!plan.discoveries.length && (
          <p className="trip-empty-small">{copy.noDiscovery}</p>
        )}
        <div className="trip-discovery-list">
          {plan.discoveries.map((item) => (
            <article key={item.stop.id} className="trip-discovery-card">
              <div>
                <h3>{tripStopName(item.stop, locale)}</h3>
                <p className="trip-anime-title">
                  {localizedNavText(
                    catalog.animes[item.stop.subjectId ?? ""] ?? item.stop.name,
                    locale,
                  )}
                </p>
                <small>
                  {copy.distance} {item.distanceKm.toFixed(1)} km
                </small>
                <div className="trip-links">
                  <StopLinks stop={item.stop} locale={locale} />
                </div>
              </div>
              <button
                type="button"
                className="trip-add-button"
                onClick={() => onAdd(item.stop)}
                aria-label={`${copy.add} ${tripStopName(item.stop, locale)}`}
              >
                + {copy.add}
              </button>
            </article>
          ))}
        </div>
      </section>
      <section className="trip-panel">
        <div className="trip-section-heading">
          <span className="trip-section-icon trip-green" aria-hidden="true">
            ♧
          </span>
          <h2>{copy.nearby}</h2>
        </div>
        <p className="trip-muted">{copy.nearbyHelp}</p>
        {!plan.nearby.length && (
          <p className="trip-empty-small">{copy.noNearby}</p>
        )}
        <div className="trip-experience-grid">
          {plan.nearby.map(({ stop, distanceKm: distance }) => (
            <article key={stop.id} className="trip-experience">
              <span className={`trip-kind trip-kind-${stop.kind}`}>
                {copy[stop.kind]}
              </span>
              <h3>{tripStopName(stop, locale)}</h3>
              <p>
                {stop.description && localizedNavText(stop.description, locale)}
              </p>
              <small>
                {copy.distance} {distance.toFixed(1)} km · {stop.minutes}{" "}
                {copy.min}
              </small>
              <div className="trip-links">
                <StopLinks stop={stop} locale={locale} />
              </div>
              <button
                type="button"
                className="trip-add-button"
                onClick={() => onAdd(stop)}
              >
                + {copy.add}
              </button>
            </article>
          ))}
        </div>
      </section>
      <section className="trip-panel">
        <h2>{copy.localSearch}</h2>
        <div className="trip-local-list">
          {localStops.map((stop) => (
            <div key={stop.id}>
              <strong>{tripStopName(stop, locale)}</strong>
              <div className="trip-links">
                {(["restaurants", "baths", "attractions"] as const).map(
                  (key) => (
                    <a
                      key={key}
                      href={nearbySearchUrl(stop, copy[key])}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {copy[key]} ↗
                    </a>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="trip-klook">
        <span className="trip-klook-brand">
          Klook <span aria-hidden="true">↗</span>
        </span>
        <h2>{copy.klook}</h2>
        <p>{copy.klookHelp}</p>
        <div className="trip-links">
          {regions.map((region) => {
            const offer = klookLinks[region];
            if (!offer) return null;
            const hub = TRAVEL_HUBS.find((item) => item.id === region);
            const label = hub
              ? localizedNavText(hub.name, locale)
              : region === "japan"
                ? { zh: "日本", "zh-tw": "日本", ja: "日本", en: "Japan" }[
                    locale
                  ]
                : "Klook";
            return (
              <a
                key={region}
                href={offer.href}
                target="_blank"
                rel={
                  offer.sponsored
                    ? "sponsored nofollow noopener noreferrer"
                    : "noopener noreferrer"
                }
                onClick={() =>
                  capturePostHogEvent(POSTHOG_EVENTS.affiliateLinkClicked, {
                    locale,
                    provider: "klook",
                    page_type: "planner",
                    region_id: region,
                    sponsored: offer.sponsored,
                  })
                }
              >
                {label} ↗ {offer.sponsored && <small>{copy.sponsored}</small>}
              </a>
            );
          })}
        </div>
        {hasSponsored && <small>{copy.disclosure}</small>}
      </section>
    </div>
  );
}
