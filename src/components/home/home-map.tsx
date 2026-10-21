"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import {
  HOME_BOUNDS_EVENT,
  HOME_FOCUS_WORK_EVENT,
  HOME_ORIGIN_EVENT,
  type HomeBoundsDetail,
  type HomeFocusWorkDetail,
  type HomeOriginDetail,
} from "~/components/home/home-events";
import { getHomePageCopy } from "~/lib/home-page-copy";
import type { HomeLocale } from "~/lib/home-locale";
import { readHomeOrigin, rememberHomeOrigin } from "~/lib/home-origin";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import { workFocusLngLats } from "~/lib/home-work-focus";
import {
  PILGRIMAGE_MAP_STYLE,
  animeTitle,
  googleMapsDirectionsUrl,
  googleStreetViewUrl,
  loadNavCatalog,
  localizedNavText,
  type NavCatalog,
  type NavSpot,
} from "~/lib/pilgrimage-nav";
import "maplibre-gl/dist/maplibre-gl.css";

const SOURCE_ID = "home-spots";
const JAPAN_BOUNDS: [[number, number], [number, number]] = [
  [122.9, 24.0],
  [145.8, 45.6],
];

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function spotCollection(
  spots: readonly NavSpot[],
  animes: NavCatalog["animes"],
  locale: HomeLocale,
  focusId: string | null,
) {
  return {
    type: "FeatureCollection" as const,
    features: spots.map((spot) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [spot.lng, spot.lat] as [number, number],
      },
      properties: {
        id: spot.id,
        name: localizedNavText(spot.name, locale),
        anime: animeTitle(animes, spot.subjectId, locale),
        subjectId: spot.subjectId,
        dim: focusId && spot.subjectId !== focusId ? 1 : 0,
      },
    })),
  };
}

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
      center: [138.2, 36.2],
      zoom: 4.4,
      attributionControl: false,
      cooperativeGestures: false,
      maxZoom: 18,
    });
    mapRef.current = map;
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
        clusterProperties: {
          dimSum: ["+", ["coalesce", ["get", "dim"], 0]],
        },
      });
      const clusterDim: maplibregl.ExpressionSpecification = [
        "case",
        [
          "all",
          [">", ["get", "dimSum"], 0],
          ["==", ["get", "dimSum"], ["get", "point_count"]],
        ],
        0.35,
        1,
      ];
      map.addLayer({
        id: "home-cluster-halo",
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#f9a8d4",
          "circle-opacity": ["*", 0.25, clusterDim],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            22,
            25,
            28,
            100,
            36,
          ],
        },
      });
      map.addLayer({
        id: "home-clusters",
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "case",
            [
              "all",
              [">", ["get", "dimSum"], 0],
              ["==", ["get", "dimSum"], ["get", "point_count"]],
            ],
            "#6d6278",
            "#f9a8d4",
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            16,
            25,
            20,
            100,
            26,
          ],
          "circle-opacity": clusterDim,
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
          "circle-color": [
            "case",
            ["==", ["get", "dim"], 1],
            "#6d6278",
            "#f9a8d4",
          ],
          "circle-radius": ["case", ["==", ["get", "dim"], 1], 5, 7],
          "circle-opacity": ["case", ["==", ["get", "dim"], 1], 0.35, 1],
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
          (source as maplibregl.GeoJSONSource).getClusterExpansionZoom(
            clusterId,
          ),
        ).then((zoom) => {
          map.easeTo({
            center: [center[0] ?? 0, center[1] ?? 0],
            zoom,
            duration: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
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
      if (!focusedId)
        map.fitBounds(JAPAN_BOUNDS, { padding: 28, animate: false });
      publishBounds(map);
      mapRef.current = map;
      ensureYou();
      if (focusedId) showFocus();
      else pushSpots();
    });
    map.on("moveend", () => {
      publishBounds(map);
      ensureYou();
    });
    let catalogReady: NavCatalog | null = null;
    let focusedId: string | null = null;
    let savedCamera: {
      lng: number;
      lat: number;
      zoom: number;
      bearing: number;
      pitch: number;
    } | null = null;

    function ensureYou() {
      const origin = readHomeOrigin();
      if (!origin) return;
      const existing = youRef.current?.getElement();
      if (youRef.current && existing?.isConnected) {
        youRef.current.setLngLat([origin.lng, origin.lat]);
        existing.style.zIndex = "10";
        return;
      }
      const element = document.createElement("div");
      element.className = "home-you";
      element.style.zIndex = "10";
      youRef.current = new maplibregl.Marker({ element })
        .setLngLat([origin.lng, origin.lat])
        .addTo(map);
    }

    function pushSpots() {
      if (!catalogReady) return;
      const source = map.getSource(SOURCE_ID);
      if (source?.type !== "geojson") return;
      (source as maplibregl.GeoJSONSource).setData(
        spotCollection(
          catalogReady.spots,
          catalogReady.animes,
          locale,
          focusedId,
        ),
      );
      ensureYou();
    }

    function showFocus() {
      pushSpots();
      if (!focusedId || !catalogReady || !map.getSource(SOURCE_ID)) return;
      const spots = catalogReady.spots.filter(
        (spot) => spot.subjectId === focusedId,
      );
      const coords = workFocusLngLats(spots, readHomeOrigin());
      if (coords.length === 0) return;
      const bounds = new maplibregl.LngLatBounds(coords[0], coords[0]);
      for (const coord of coords) bounds.extend(coord);
      map.fitBounds(bounds, {
        padding: 48,
        maxZoom: 14,
        duration: prefersReducedMotion() ? 0 : 600,
      });
      ensureYou();
    }

    function onOrigin(event: Event) {
      const detail = (event as CustomEvent<HomeOriginDetail>).detail;
      if (
        !detail ||
        !Number.isFinite(detail.lat) ||
        !Number.isFinite(detail.lng)
      ) {
        return;
      }
      rememberHomeOrigin(detail);
      ensureYou();
      map.flyTo({
        center: [detail.lng, detail.lat],
        zoom: detail.keepZoom ? map.getZoom() : 13,
        duration: prefersReducedMotion() ? 0 : 700,
      });
    }

    function onFocusWork(event: Event) {
      const detail = (event as CustomEvent<HomeFocusWorkDetail>).detail;
      const subjectId = detail?.subjectId ?? null;
      if (subjectId) {
        if (!focusedId) {
          const center = map.getCenter();
          savedCamera = {
            lng: center.lng,
            lat: center.lat,
            zoom: map.getZoom(),
            bearing: map.getBearing(),
            pitch: map.getPitch(),
          };
        }
        focusedId = subjectId;
        showFocus();
        return;
      }
      focusedId = null;
      pushSpots();
      if (savedCamera) {
        const camera = savedCamera;
        savedCamera = null;
        map.easeTo({
          center: [camera.lng, camera.lat],
          zoom: camera.zoom,
          bearing: camera.bearing,
          pitch: camera.pitch,
          duration: prefersReducedMotion() ? 0 : 500,
        });
      }
      ensureYou();
    }

    window.addEventListener(HOME_ORIGIN_EVENT, onOrigin);
    window.addEventListener(HOME_FOCUS_WORK_EVENT, onFocusWork);
    ensureYou();

    map.on("load", () => {
      if (focusedId) showFocus();
      else pushSpots();
    });
    void loadNavCatalog()
      .then((catalog) => {
        if (cancelled) return;
        catalogReady = catalog;
        if (focusedId) showFocus();
        else pushSpots();
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
      window.removeEventListener(HOME_FOCUS_WORK_EVENT, onFocusWork);
      observer.disconnect();
      youRef.current?.remove();
      youRef.current = null;
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
        <button
          type="button"
          className="home-tool home-tool-locate"
          data-testid="home-my-location"
          aria-label={copy.myLocation}
          onClick={() => {
            const origin = readHomeOrigin();
            const current = mapRef.current;
            if (origin && current) {
              current.flyTo({
                center: [origin.lng, origin.lat],
                zoom: current.getZoom(),
                duration: prefersReducedMotion() ? 0 : 700,
              });
              return;
            }
            if (!navigator.geolocation) {
              window.location.assign(
                withPilgrimageLocale("/pilgrimage#nearby", locale),
              );
              return;
            }
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const detail: HomeOriginDetail = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  keepZoom: true,
                };
                rememberHomeOrigin(detail);
                window.dispatchEvent(
                  new CustomEvent(HOME_ORIGIN_EVENT, { detail }),
                );
              },
              () => {
                window.location.assign(
                  withPilgrimageLocale("/pilgrimage#nearby", locale),
                );
              },
              {
                enableHighAccuracy: false,
                timeout: 12_000,
                maximumAge: 60_000,
              },
            );
          }}
        >
          <LocateIcon />
        </button>
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
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
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
