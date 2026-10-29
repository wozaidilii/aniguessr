"use client";

import { useEffect, useMemo, useState } from "react";
import { localizedNavText, type NavCatalog } from "~/lib/pilgrimage-nav";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { getTravelCopy } from "~/lib/travel/copy";
import { getGuideCopy } from "~/lib/travel/guide-copy";
import { guideTitle, recommendGuides } from "~/lib/travel/guides";
import {
  buildCommunityQuestion,
  exportGuideText,
  JAPAN_TRAVEL_FORUM,
} from "~/lib/travel/guide-export";
import { TRAVEL_REGIONS, travelRegionFor } from "~/lib/travel/regions";
import type { TripPlan, TripState } from "~/lib/travel/types";

export function PlannerGuides({
  plan,
  state,
  catalog,
  locale,
}: {
  plan: TripPlan;
  state: TripState;
  catalog: NavCatalog;
  locale: PilgrimageLocale;
}) {
  const copy = getGuideCopy(locale);
  const travel = getTravelCopy(locale);
  const guides = useMemo(
    () => recommendGuides(plan, state, locale),
    [plan, state, locale],
  );
  const [status, setStatus] = useState("");
  const [fallback, setFallback] = useState("");
  const [question, setQuestion] = useState<{
    key: string;
    text: string;
  } | null>(null);
  const key = `${locale}:${JSON.stringify(state)}`;
  useEffect(() => {
    setStatus("");
    setFallback("");
  }, [key]);
  const currentQuestion = question?.key === key ? question : null;
  const scheduled = plan.days.flatMap((day) =>
    day.stops.map(({ stop }) => stop),
  );
  const inJapan =
    scheduled.length > 0 && scheduled.every((stop) => !!travelRegionFor(stop));
  async function copyText(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(message);
      setFallback("");
    } catch {
      setStatus(copy.copyFallback);
      setFallback(text);
    }
  }
  return (
    <section
      className="trip-panel trip-guides"
      aria-labelledby="trip-guides-title"
    >
      <div className="trip-section-heading">
        <h2 id="trip-guides-title">{copy.title}</h2>
        {guides.length > 0 && (
          <button
            type="button"
            className="trip-text-button trip-no-print"
            onClick={() =>
              void copyText(exportGuideText(plan, state, locale), copy.copied)
            }
          >
            {copy.copy}
          </button>
        )}
      </div>
      <p className="trip-muted">{copy.intro}</p>
      {!guides.length && <p className="trip-empty-small">{copy.empty}</p>}
      <div className="trip-guide-grid">
        {guides.map(({ guide, regions, topics }) => (
          <article className="trip-guide-card" key={guide.id}>
            <p className="trip-guide-publisher">
              {guide.publisher} <span>{copy[guide.kind]}</span>
            </p>
            <h3>
              <a href={guide.url} target="_blank" rel="noopener noreferrer">
                {guideTitle(guide, locale)} ↗
              </a>
            </h3>
            <p className="trip-guide-match">
              {copy.matches}{" "}
              {regions
                .map((id) =>
                  localizedNavText(
                    TRAVEL_REGIONS.find((region) => region.id === id)!.name,
                    locale,
                  ),
                )
                .join(" · ")}
            </p>
            <div className="trip-guide-topics">
              {topics.map((topic) => (
                <span key={topic}>
                  {topic === "transport" ? copy.transport : travel[topic]}
                </span>
              ))}
            </div>
            <small>
              {copy.language}:{" "}
              {guide.language === "en" ? copy.english : copy.traditional} ·{" "}
              {copy.checked}:{" "}
              <time dateTime={guide.checkedAt}>{guide.checkedAt}</time>
            </small>
            <a
              className="trip-guide-read"
              href={guide.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy.read} ↗
            </a>
            <span className="trip-print-only">{guide.url}</span>
          </article>
        ))}
      </div>
      <p className="trip-guide-caveat">{copy.caveat}</p>
      <div className="trip-community trip-no-print">
        <h3>{copy.community}</h3>
        <p className="trip-muted">
          {inJapan ? copy.communityIntro : copy.questionUnavailable}
        </p>
        {inJapan && (
          <>
            <div className="trip-links">
              <button
                type="button"
                className="trip-button"
                onClick={() => {
                  setQuestion({
                    key,
                    text: buildCommunityQuestion(plan, state, catalog),
                  });
                  setFallback("");
                  setStatus("");
                }}
              >
                {question ? copy.regenerate : copy.prepare}
              </button>
              <a
                href={JAPAN_TRAVEL_FORUM}
                target="_blank"
                rel="noopener noreferrer"
              >
                {copy.openForum} ↗
              </a>
            </div>
            {currentQuestion && (
              <>
                <label htmlFor="trip-community-question">
                  {copy.questionLabel}
                </label>
                <textarea
                  id="trip-community-question"
                  rows={12}
                  value={currentQuestion.text}
                  onChange={(event) =>
                    setQuestion({ key, text: event.target.value })
                  }
                />
                <button
                  type="button"
                  className="trip-button"
                  onClick={() =>
                    void copyText(currentQuestion.text, copy.questionCopied)
                  }
                >
                  {copy.copyQuestion}
                </button>
              </>
            )}
            <p className="trip-guide-caveat">{copy.privacy}</p>
          </>
        )}
        <p role="status" aria-live="polite">
          {status}
        </p>
        {fallback && (
          <textarea
            aria-label={copy.copyFallback}
            rows={8}
            value={fallback}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
        )}
      </div>
    </section>
  );
}
