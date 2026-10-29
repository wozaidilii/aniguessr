"use client";

import { tripStopName } from "~/lib/travel/labels";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PILGRIMAGE_MAP_STYLE } from "~/lib/pilgrimage-nav";
import { tuneHomeMapStyle } from "~/lib/home-map-style";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { getTravelCopy } from "~/lib/travel/copy";
import type { TripStop } from "~/lib/travel/types";

const COLORS = ["#c4275f", "#087f8c", "#a66613", "#6555ab", "#338355"];
export function PlannerMap({
  stops,
  dayById,
  locale,
}: {
  stops: TripStop[];
  dayById: Record<string, number>;
  locale: PilgrimageLocale;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const loadedMap = useRef<maplibregl.Map | null>(null);
  const lastFrame = useRef("");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const copy = getTravelCopy(locale);

  useEffect(() => {
    if (!container.current) return;
    setReady(false);
    loadedMap.current = null;
    lastFrame.current = "";
    let instance: maplibregl.Map;
    try {
      instance = new maplibregl.Map({
        container: container.current,
        style: PILGRIMAGE_MAP_STYLE,
        center: [137.5, 35.5],
        zoom: 5,
        attributionControl: { compact: true },
      });
    } catch {
      setFailed(true);
      return;
    }
    map.current = instance;
    instance.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    instance.on("load", () => {
      loadedMap.current = instance;
      setReady(true);
      setFailed(false);
    });
    instance.on("error", () => {
      if (!instance.isStyleLoaded()) setFailed(true);
    });
    const resize = new ResizeObserver(() => instance.resize());
    resize.observe(container.current);
    const timeout = window.setTimeout(() => {
      if (!instance.isStyleLoaded()) setFailed(true);
    }, 15000);
    return () => {
      window.clearTimeout(timeout);
      resize.disconnect();
      map.current = null;
      loadedMap.current = null;
      instance.remove();
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    // Track the instance's initial load, not tile loading after a camera change.
    if (!instance || !ready || loadedMap.current !== instance) return;
    tuneHomeMapStyle(instance, locale);
    const markers = stops.map((stop, i) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "trip-map-marker";
      element.style.background = dayById[stop.id]
        ? COLORS[(dayById[stop.id]! - 1) % COLORS.length]!
        : "#7a8174";
      element.textContent = String(i + 1);
      const name = tripStopName(stop, locale);
      element.setAttribute("aria-label", `${i + 1}. ${name}`);
      const popup = new maplibregl.Popup({ offset: 18 }).setText(
        `${i + 1}. ${name}`,
      );
      return new maplibregl.Marker({ element })
        .setLngLat([stop.lng, stop.lat])
        .setPopup(popup)
        .addTo(instance);
    });
    const data: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features:
        stops.length > 1
          ? [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: stops.map((stop) => [stop.lng, stop.lat]),
                },
              },
            ]
          : [],
    };
    const source = instance.getSource<maplibregl.GeoJSONSource>("trip-route");
    if (source) source.setData(data);
    else {
      instance.addSource("trip-route", { type: "geojson", data });
      instance.addLayer({
        id: "trip-route-line",
        type: "line",
        source: "trip-route",
        paint: {
          "line-color": "#c4275f",
          "line-width": 3,
          "line-opacity": 0.65,
          "line-dasharray": [2, 2],
        },
      });
    }
    const frame = stops
      .map((stop) => `${stop.id}:${stop.lat}:${stop.lng}`)
      .join("|");
    if (stops.length && frame !== lastFrame.current) {
      const bounds = new maplibregl.LngLatBounds();
      stops.forEach((stop) => bounds.extend([stop.lng, stop.lat]));
      instance.fitBounds(bounds, { padding: 55, maxZoom: 13, duration: 0 });
      lastFrame.current = frame;
    }
    return () => markers.forEach((marker) => marker.remove());
  }, [stops, dayById, locale, ready]);

  return (
    <div className="trip-map-wrap">
      <div
        ref={container}
        className="trip-map"
        role="region"
        aria-label={copy.map}
      />
      {failed && (
        <p className="trip-map-error" role="status">
          {copy.mapError}
        </p>
      )}
    </div>
  );
}
