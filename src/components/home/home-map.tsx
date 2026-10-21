"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import {
  HOME_BOUNDS_EVENT,
  HOME_FOCUS_WORK_EVENT,
  HOME_ORIGIN_EVENT,
  signalHomeMapGesture,
  type HomeBoundsDetail,
  type HomeFocusWorkDetail,
  type HomeOriginDetail,
} from "~/components/home/home-events";
import {
  HOME_AREA_SOURCE,
  HOME_CLUSTER_SOURCE,
  HOME_DOTS_SOURCE,
  HOME_PILL_LAYER_IDS,
  HOME_PREF_SOURCE,
  installHomeMapLayers,
  labelCollection,
  setHomeGeoJson,
  spotCollection,
} from "~/components/home/home-map-layers";
import {
  KANTO_INITIAL_CENTER,
  KANTO_INITIAL_ZOOM,
  KANTO_SHONAN_BOUNDS,
} from "~/lib/home-map-bounds";
import { loadHomeMapLabels, type HomeMapLabels } from "~/lib/home-map-labels";
import {
  HOME_IDEOGRAPH_FONT,
  HOME_MAP_STYLE,
  tuneHomeMapStyle,
} from "~/lib/home-map-style";
import { getHomePageCopy } from "~/lib/home-page-copy";
import type { HomeLocale } from "~/lib/home-locale";
import { readHomeOrigin, rememberHomeOrigin } from "~/lib/home-origin";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import { workFocusLngLats } from "~/lib/home-work-focus";
import {
  FAVORITES_CHANGED_EVENT,
  readFavoriteAnimeIds,
} from "~/lib/pilgrimage-favorites";
import {
  googleMapsDirectionsUrl,
  loadNavCatalog,
  type NavCatalog,
} from "~/lib/pilgrimage-nav";
import "maplibre-gl/dist/maplibre-gl.css";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Space labels need so they stay clear of the chip band or the search card. */
function homeMapTopPadding(map: maplibregl.Map): number {
  if (window.matchMedia("(max-width: 1023px)").matches) return 56;
  const stack = map
    .getContainer()
    .closest(".home-mapstage")
    ?.querySelector(".home-map-searchstack");
  if (!stack) return 28;
  const mapTop = map.getContainer().getBoundingClientRect().top;
  const cardBottom = stack.getBoundingClientRect().bottom;
  return Math.max(28, Math.ceil(cardBottom - mapTop + 8));
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
      style: HOME_MAP_STYLE,
      center: KANTO_INITIAL_CENTER,
      zoom: KANTO_INITIAL_ZOOM,
      attributionControl: false,
      cooperativeGestures: false,
      maxZoom: 18,
      localIdeographFontFamily: HOME_IDEOGRAPH_FONT,
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
      tuneHomeMapStyle(map, locale);
      installHomeMapLayers(map);
      const pointCursor = (cursor: string) => {
        map.getCanvas().style.cursor = cursor;
      };
      map.on("mouseenter", "home-clusters", () => pointCursor("pointer"));
      map.on("mouseleave", "home-clusters", () => pointCursor(""));
      map.on("mouseenter", "home-points", () => pointCursor("pointer"));
      map.on("mouseleave", "home-points", () => pointCursor(""));
      for (const layerId of HOME_PILL_LAYER_IDS) {
        map.on("mouseenter", layerId, () => pointCursor("pointer"));
        map.on("mouseleave", layerId, () => pointCursor(""));
        map.on("click", layerId, (event) => {
          const props = event.features?.[0]?.properties;
          if (!props) return;
          const west = Number(props.west);
          const south = Number(props.south);
          const east = Number(props.east);
          const north = Number(props.north);
          if (![west, south, east, north].every(Number.isFinite)) return;
          map.fitBounds(
            [
              [west, south],
              [east, north],
            ],
            {
              padding: {
                top: homeMapTopPadding(map),
                right: 48,
                bottom: 48,
                left: 48,
              },
              maxZoom: 14,
              duration: prefersReducedMotion() ? 0 : 600,
            },
          );
        });
      }
      map.on("click", "home-clusters", (event) => {
        const feature = event.features?.[0];
        if (feature?.geometry.type !== "Point") return;
        const clusterId = Number(feature.properties?.cluster_id);
        if (!Number.isFinite(clusterId)) return;
        const source = map.getSource(HOME_CLUSTER_SOURCE);
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
      if (!focusedId) {
        map.fitBounds(KANTO_SHONAN_BOUNDS, {
          padding: {
            top: homeMapTopPadding(map),
            right: 28,
            bottom: 28,
            left: 28,
          },
          animate: false,
        });
      }
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
    map.on("dragstart", signalHomeMapGesture);
    map.on("zoomstart", (event) => {
      if (event.originalEvent) signalHomeMapGesture();
    });
    let catalogReady: NavCatalog | null = null;
    let labelsReady: HomeMapLabels | null = null;
    let favoriteIds = new Set(readFavoriteAnimeIds());
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
        existing.style.zIndex = "30";
        return;
      }
      const element = document.createElement("div");
      element.className = "home-you";
      element.style.zIndex = "30";
      youRef.current = new maplibregl.Marker({ element })
        .setLngLat([origin.lng, origin.lat])
        .addTo(map);
    }

    function pushSpots() {
      if (!catalogReady || !map.getSource(HOME_CLUSTER_SOURCE)) return;
      const data = spotCollection(
        catalogReady.spots,
        catalogReady.animes,
        locale,
        focusedId,
        favoriteIds,
      );
      setHomeGeoJson(map, HOME_CLUSTER_SOURCE, data);
      setHomeGeoJson(map, HOME_DOTS_SOURCE, data);
      ensureYou();
    }

    function pushLabels() {
      if (!labelsReady || !map.getSource(HOME_AREA_SOURCE)) return;
      setHomeGeoJson(
        map,
        HOME_AREA_SOURCE,
        labelCollection(labelsReady.areas, locale),
      );
      setHomeGeoJson(
        map,
        HOME_PREF_SOURCE,
        labelCollection(labelsReady.prefectures, locale),
      );
    }

    function showFocus() {
      pushSpots();
      if (!focusedId || !catalogReady || !map.getSource(HOME_CLUSTER_SOURCE))
        return;
      const spots = catalogReady.spots.filter(
        (spot) => spot.subjectId === focusedId,
      );
      const coords = workFocusLngLats(spots, readHomeOrigin());
      if (coords.length === 0) return;
      const bounds = new maplibregl.LngLatBounds(coords[0], coords[0]);
      for (const coord of coords) bounds.extend(coord);
      map.fitBounds(bounds, {
        padding: {
          top: homeMapTopPadding(map),
          right: 48,
          bottom: 48,
          left: 48,
        },
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

    function onFavorites() {
      favoriteIds = new Set(readFavoriteAnimeIds());
      pushSpots();
    }

    window.addEventListener(HOME_ORIGIN_EVENT, onOrigin);
    window.addEventListener(HOME_FOCUS_WORK_EVENT, onFocusWork);
    window.addEventListener(FAVORITES_CHANGED_EVENT, onFavorites);
    window.addEventListener("storage", onFavorites);
    ensureYou();

    map.on("load", () => {
      pushLabels();
      if (focusedId) showFocus();
      else pushSpots();
    });
    void loadHomeMapLabels()
      .then((labels) => {
        if (cancelled || !labels) return;
        labelsReady = labels;
        pushLabels();
      })
      .catch(() => undefined);
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
      window.removeEventListener(FAVORITES_CHANGED_EVENT, onFavorites);
      window.removeEventListener("storage", onFavorites);
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
      <div className="home-chip-scrim" aria-hidden="true" />
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
              window.location.assign(withPilgrimageLocale("/", locale));
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
                window.location.assign(withPilgrimageLocale("/", locale));
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
          onClick={() => {
            signalHomeMapGesture();
            mapRef.current?.zoomIn();
          }}
        >
          +
        </button>
        <button
          type="button"
          className="home-tool home-zoom"
          aria-label={copy.zoomOut}
          onClick={() => {
            signalHomeMapGesture();
            mapRef.current?.zoomOut();
          }}
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
  const title = document.createElement("div");
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
  const spotHref = withPilgrimageLocale(
    `/pilgrimage/spots/${encodeSpotId(spot.id)}`,
    locale,
  );
  actions.append(
    actionLink(spotHref, copy.details, true, false),
    actionLink(
      googleMapsDirectionsUrl(spot.lat, spot.lng),
      copy.navigate,
      false,
      true,
    ),
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

function actionLink(
  href: string,
  label: string,
  primary: boolean,
  newTab: boolean,
) {
  const link = document.createElement("a");
  link.href = href;
  if (newTab) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
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
