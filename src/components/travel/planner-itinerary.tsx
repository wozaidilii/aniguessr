"use client";

import { tripStopName } from "~/lib/travel/labels";
import Link from "next/link";
import { localizedNavText, type NavCatalog } from "~/lib/pilgrimage-nav";
import {
  withPilgrimageLocale,
  type PilgrimageLocale,
} from "~/lib/pilgrimage-locale";
import { dayLabel, getTravelCopy } from "~/lib/travel/copy";
import { legDirectionsUrl } from "~/lib/travel/engine";
import { formatTripTime } from "~/lib/travel/export";
import { tripDate } from "~/lib/travel/state";
import type { TripPlan, TripState, TripStop } from "~/lib/travel/types";

export function StopLinks({
  stop,
  locale,
}: {
  stop: TripStop;
  locale: PilgrimageLocale;
}) {
  const copy = getTravelCopy(locale);
  return (
    <>
      {stop.spotId && (
        <Link
          href={withPilgrimageLocale(
            `/pilgrimage/spots/${encodeURIComponent(stop.spotId)}`,
            locale,
          )}
          target="_blank"
        >
          {copy.details} ↗
        </Link>
      )}
      {stop.sourceUrl && (
        <a href={stop.sourceUrl} target="_blank" rel="noopener noreferrer">
          {copy.official} ↗
        </a>
      )}
    </>
  );
}

export function PlannerItinerary({
  plan,
  state,
  catalog,
  locale,
  onRemove,
  onMove,
  onDuration,
  onDayBreak,
}: {
  plan: TripPlan;
  state: TripState;
  catalog: NavCatalog;
  locale: PilgrimageLocale;
  onRemove: (id: string) => void;
  onMove: (id: string, delta: number) => void;
  onDuration: (id: string, minutes: number) => void;
  onDayBreak: (id: string) => void;
}) {
  const copy = getTravelCopy(locale);
  return (
    <div className="trip-itinerary">
      {plan.longTransfers > 0 && (
        <p className="trip-notice">{copy.longTransfer}</p>
      )}
      {plan.unknownIds.length > 0 && (
        <p className="trip-notice">{copy.unknown}</p>
      )}
      {plan.days.map((day) => (
        <section className="trip-day" key={day.day}>
          <header className="trip-day-header">
            <span
              className={`trip-day-number trip-day-color-${(day.day - 1) % 5}`}
            >
              {String(day.day).padStart(2, "0")}
            </span>
            <div>
              <h3>
                {dayLabel(locale, day.day)}{" "}
                <span>{tripDate(state.startDate, day.day, locale)}</span>
              </h3>
              <p>
                {day.stops.length} {copy.stops} · ~
                {(day.minutes / 60).toFixed(1)} {copy.hours} · ~
                {day.distanceKm.toFixed(1)} km
              </p>
            </div>
          </header>
          {day.overBudget && <p className="trip-notice">{copy.overBudget}</p>}
          {!day.stops.length ? (
            <p className="trip-free-day">{copy.freeDay}</p>
          ) : (
            <>
              <ol className="trip-timeline">
                {day.stops.map((visit) => {
                  const stop = visit.stop;
                  const index = plan.ordered.findIndex(
                    (item) => item.id === stop.id,
                  );
                  const title = stop.subjectId
                    ? catalog.animes[stop.subjectId]
                    : undefined;
                  return (
                    <li key={stop.id}>
                      <div className="trip-time">
                        <span>{formatTripTime(visit.arrivalMinutes)}</span>
                        <i aria-hidden="true" />
                      </div>
                      <div className="trip-visit">
                        <div className="trip-visit-top">
                          <span className={`trip-kind trip-kind-${stop.kind}`}>
                            {copy[stop.kind]}
                          </span>
                          <div className="trip-stop-actions trip-no-print">
                            {state.mode === "anime" && (
                              <>
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => onMove(stop.id, -1)}
                                  aria-label={`${copy.up} ${tripStopName(stop, locale)}`}
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  disabled={index === plan.ordered.length - 1}
                                  onClick={() => onMove(stop.id, 1)}
                                  aria-label={`${copy.down} ${tripStopName(stop, locale)}`}
                                >
                                  ↓
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => onRemove(stop.id)}
                              aria-label={`${copy.remove} ${tripStopName(stop, locale)}`}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        <h4>{tripStopName(stop, locale)}</h4>
                        {title && (
                          <p className="trip-anime-title">
                            {localizedNavText(title, locale)}
                          </p>
                        )}
                        {stop.description && stop.kind !== "hub" && (
                          <p className="trip-muted">
                            {localizedNavText(stop.description, locale)}
                          </p>
                        )}
                        <div className="trip-visit-meta">
                          <label>
                            {copy.visit}{" "}
                            <input
                              className="trip-duration trip-no-print"
                              type="number"
                              min="0"
                              max="720"
                              step="5"
                              value={stop.minutes}
                              aria-label={`${tripStopName(stop, locale)} ${copy.visit} (${copy.min})`}
                              onChange={(event) => {
                                const value = event.target.valueAsNumber;
                                if (Number.isFinite(value))
                                  onDuration(
                                    stop.id,
                                    Math.max(
                                      0,
                                      Math.min(720, Math.round(value)),
                                    ),
                                  );
                              }}
                            />
                            <span className="trip-print-only">
                              {stop.minutes}
                            </span>{" "}
                            {copy.min}
                          </label>
                          {visit.from && (
                            <>
                              {" "}
                              · {copy.estimated} {visit.travelMinutes}{" "}
                              {copy.min} / {visit.distanceKm.toFixed(1)} km
                            </>
                          )}
                        </div>
                        <div className="trip-links">
                          <a
                            href={legDirectionsUrl(
                              visit.from,
                              stop,
                              state.transport,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {copy.directions} ↗
                          </a>
                          <StopLinks stop={stop} locale={locale} />
                        </div>
                        {(index > 0 ||
                          state.dayBreakBefore.includes(stop.id)) && (
                          <label className="trip-day-boundary trip-no-print">
                            <input
                              type="checkbox"
                              checked={state.dayBreakBefore.includes(stop.id)}
                              onChange={() => onDayBreak(stop.id)}
                              aria-label={`${copy.startNewDay}: ${tripStopName(stop, locale)}`}
                            />
                            {copy.startNewDay}
                          </label>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <p className="trip-day-rest">{copy.rest}</p>
            </>
          )}
        </section>
      ))}
      {plan.unscheduled.length > 0 && (
        <section className="trip-overflow">
          <h3>
            {copy.overflow} · {plan.unscheduled.length}
          </h3>
          <p>{copy.overflowHelp}</p>
          <ul>
            {plan.unscheduled.map((stop) => (
              <li key={stop.id}>
                <span>{tripStopName(stop, locale)}</span>
                {state.dayBreakBefore.includes(stop.id) && (
                  <button
                    type="button"
                    className="trip-text-button trip-no-print"
                    onClick={() => onDayBreak(stop.id)}
                  >
                    {copy.removeDayBreak}
                  </button>
                )}
                <button
                  type="button"
                  className="trip-text-button trip-no-print"
                  onClick={() => onRemove(stop.id)}
                >
                  {copy.remove}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {plan.omittedAnimeSpots > 0 && (
        <p className="trip-muted">
          {copy.autoLimit} ({plan.omittedAnimeSpots})
        </p>
      )}
    </div>
  );
}
