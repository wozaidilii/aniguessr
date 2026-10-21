"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import {
  HOME_BOUNDS_EVENT,
  HOME_ORIGIN_EVENT,
  type HomeBoundsDetail,
  type HomeOriginDetail,
} from "~/components/home/home-events";
import {
  KANTO_INITIAL_CENTER,
  KANTO_INITIAL_ZOOM,
  KANTO_SHONAN_BOUNDS,
} from "~/lib/home-map-bounds";
import { getHomePageCopy } from "~/lib/home-page-copy";
import type { HomeLocale } from "~/lib/home-locale";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import {
  PILGRIMAGE_MAP_STYLE,
  animeTitle,
  googleMapsDirectionsUrl,
  googleStreetViewUrl,
  loadNavCatalog,
  localizedNavText,
  type NavCatalog,
} from "~/lib/pilgrimage-nav";
import "maplibre-gl/dist/maplibre-gl.css";

const SOURCE_ID = "home-spots";

export function HomeMap({ locale }: { locale: HomeLocale }) {
  const copy = getHomePageCopy(locale);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const youRef = useRef<maplibregl.Marker | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let loaded = false;
    const map = new maplibregl.Map({
      container,
      style: PILGRIMAGE_MAP_STYLE,
      center: KANTO_INITIAL_CENTER,
      zoom: KANTO_INITIAL_ZOOM,
      attributionControl: false,
      cooperativeGestures: false,
      maxZoom: 18,
    });
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left",
    );
    const timer = window.setTimeout(() => {
      if (!loaded) setError(true);
    }, 15_000);
    map.on("load", () => {
      loaded = true;
      window.clearTimeout(timer);
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterRadius: 48,
        clusterMaxZoom: 14,
      });
      map.addLayer({
        id: "home-cluster-halo",
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#f9a8d4",
          "circle-opacity": 0.25,
          "circle-radius": ["step", ["get", "point_count"], 22, 25, 28, 100, 36],
        },
      });
      map.addLayer({
        id: "home-clusters",
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#f9a8d4",
          "circle-radius": ["step", ["get", "point_count"], 16, 25, 20, 100, 26],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0a0612",
        },
      });
      map.addLayer({
        id: "home-cluster-count",
        type: "symbol",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 12,
        },
        paint: { "text-color": "#0a0612" },
      });
      map.addLayer({
        id: "home-points",
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#f9a8d4",
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0a0612",
        },
      });
      const pointCursor = (cursor: string) => {
        map.getCanvas().style.cursor = cursor;
      };
      map.on("mouseenter", "home-clusters", () => pointCursor("pointer"));
      map.on("mouseleave", "home-clusters", () => pointCursor(""));
      map.on("mouseenter", "home-points", () => pointCursor("pointer"));
      map.on("mouseleave", "home-points", () => pointCursor(""));
      map.on("click", "home-clusters", (event) => {
        const feature = event.features?.[0];
        if (feature?.geometry.type !== "Point") return;
        const clusterId = Number(feature.properties?.cluster_id);
        if (!Number.isFinite(clusterId)) return;
        const source = map.getSource(SOURCE_ID);
        if (source?.type !== "geojson") return;
        const center = feature.geometry.coordinates;
        void Promise.resolve(
          (source as maplibregl.GeoJSONSource).getClusterExpansionZoom(clusterId),
        ).then((zoom) => {
          map.easeTo({
            center: [center[0] ?? 0, center[1] ?? 0],
            zoom,
            duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? 0
              : 400,
          });
        });
      });
      map.on("click", "home-points", (event) => {
        const feature = event.features?.[0];
        if (feature?.geometry.type !== "Point") return;
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;
        showPopup(map, popupRef, locale, {
          id: String(props?.id ?? ""),
          name: String(props?.name ?? ""),
          anime: String(props?.anime ?? ""),
          lng: lng ?? 0,
          lat: lat ?? 0,
        });
      });
      map.fitBounds(KANTO_SHONAN_BOUNDS, { padding: 28, animate: false });
      publishBounds(map);
      mapRef.current = map;
    });
    map.on("moveend", () => publishBounds(map));
    let catalogReady: NavCatalog | null = null;
    const applyCatalog = () => {
      if (!catalogReady) return;
      const source = map.getSource(SOURCE_ID);
      if (source?.type !== "geojson") return;
      (source as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: catalogReady.spots.map((spot) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [spot.lng, spot.lat],
          },
          properties: {
            id: spot.id,
            name: localizedNavText(spot.name, locale),
            anime: animeTitle(catalogReady?.animes ?? {}, spot.subjectId, locale),
          },
        })),
      });
    };

    function onOrigin(event: Event) {
      const detail = (event as CustomEvent<HomeOriginDetail>).detail;
      if (!detail) return;
      youRef.current?.remove();
      const element = document.createElement("div");
      element.className = "home-you";
      youRef.current = new maplibregl.Marker({ element })
        .setLngLat([detail.lng, detail.lat])
        .addTo(map);
      map.flyTo({
        center: [detail.lng, detail.lat],
        zoom: 13,
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 700,
      });
    }
    window.addEventListener(HOME_ORIGIN_EVENT, onOrigin);

    map.on("load", () => applyCatalog());
    void loadNavCatalog()
      .then((catalog) => {
        if (cancelled) return;
        catalogReady = catalog;
        applyCatalog();
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener(HOME_ORIGIN_EVENT, onOrigin);
      observer.disconnect();
      youRef.current?.remove();
      map.remove();
      mapRef.current = null;
      popupRef.current = null;
    };
  }, [attempt, locale]);

  return (
    <div className="home-map" data-testid="home-map">
      <div
        ref={containerRef}
        className="home-map-canvas"
        role="application"
        aria-label={copy.mapLabel}
      />
      <div className="home-map-tools">
        <a
          className="home-tool"
          data-find-nearby=""
          href={withPilgrimageLocale("/pilgrimage#nearby", locale)}
          aria-label={copy.locate}
        >
          <LocateIcon />
        </a>
        <button
          type="button"
          className="home-tool home-zoom"
          aria-label={copy.zoomIn}
          onClick={() => mapRef.current?.zoomIn()}
        >
          +
        </button>
        <button
          type="button"
          className="home-tool home-zoom"
          aria-label={copy.zoomOut}
          onClick={() => mapRef.current?.zoomOut()}
        >
          −
        </button>
      </div>
      {error ? (
        <button
          type="button"
          className="home-map-retry"
          onClick={() => {
            setError(false);
            setAttempt((value) => value + 1);
          }}
        >
          {copy.mapLabel}
        </button>
      ) : null}
    </div>
  );
}

function publishBounds(map: maplibregl.Map) {
  const bounds = map.getBounds();
  const center = map.getCenter();
  const detail: HomeBoundsDetail = {
    west: bounds.getWest(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    north: bounds.getNorth(),
    lat: center.lat,
    lng: center.lng,
  };
  window.dispatchEvent(new CustomEvent(HOME_BOUNDS_EVENT, { detail }));
}

function showPopup(
  map: maplibregl.Map,
  popupRef: { current: maplibregl.Popup | null },
  locale: HomeLocale,
  spot: { id: string; name: string; anime: string; lat: number; lng: number },
) {
  const copy = getHomePageCopy(locale);
  const root = document.createElement("div");
  root.className = "home-popup";
  const title = document.createElement("a");
  title.href = withPilgrimageLocale(
    `/pilgrimage/spots/${encodeSpotId(spot.id)}`,
    locale,
  );
  title.textContent = spot.name || spot.id;
  title.className = "home-popup-title";
  root.append(title);
  if (spot.anime) {
    const meta = document.createElement("p");
    meta.textContent = spot.anime;
    meta.className = "home-popup-anime";
    root.append(meta);
  }
  const actions = document.createElement("div");
  actions.className = "home-popup-actions";
  actions.append(
    actionLink(
      googleMapsDirectionsUrl(spot.lat, spot.lng),
      copy.navigate,
      true,
    ),
    actionLink(googleStreetViewUrl(spot.lat, spot.lng), copy.streetView, false),
  );
  root.append(actions);
  popupRef.current?.remove();
  const popup = new maplibregl.Popup({
    offset: 16,
    maxWidth: "232px",
    closeButton: true,
  })
    .setLngLat([spot.lng, spot.lat])
    .setDOMContent(root)
    .addTo(map);
  popupRef.current = popup;
}

function actionLink(href: string, label: string, primary: boolean) {
  const link = document.createElement("a");
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", label);
  link.className = primary ? "home-popup-go" : "home-popup-alt";
  link.textContent = label;
  return link;
}

function LocateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3v3M12 18v3M3 12h3M18 12h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
