"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { useFavoriteAnime } from "~/components/pilgrimage/favorites";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { type PilgrimageLocale, withPilgrimageLocale } from "~/lib/pilgrimage-locale";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import {
  PILGRIMAGE_MAP_STYLE,
  animeTitle,
  filterNavSpots,
  googleMapsDirectionsUrl,
  googleStreetViewUrl,
  loadNavCatalog,
  localizedNavText,
  type NavCatalog,
  type NavSpot,
} from "~/lib/pilgrimage-nav";
import "maplibre-gl/dist/maplibre-gl.css";
import "./pilgrimage-map.css";

const SOURCE_ID = "pilgrimage-spots";
const JAPAN_BOUNDS: [[number, number], [number, number]] = [
  [122.9, 24.0],
  [145.8, 45.6],
];

export function PilgrimageMap({
  locale,
  subjectId,
  locationSlug,
}: {
  locale: PilgrimageLocale;
  subjectId?: string;
  locationSlug?: string;
}) {
  const copy = getPilgrimageCopy(locale);
  const favorites = useFavoriteAnime();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const fittedKey = useRef<string | null>(null);
  const [catalog, setCatalog] = useState<NavCatalog | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const defaulted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void loadNavCatalog()
      .then((next) => {
        if (!cancelled) setCatalog(next);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (!favorites.ready || defaulted.current) return;
    defaulted.current = true;
    if (!subjectId && favorites.ids.length > 0) setFavoritesOnly(true);
  }, [favorites.ready, favorites.ids.length, subjectId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let loaded = false;
    const map = new maplibregl.Map({
      container,
      style: PILGRIMAGE_MAP_STYLE,
      center: [138.2, 36.2],
      zoom: 4.2,
      attributionControl: false,
      cooperativeGestures: true,
      maxZoom: 18,
    });
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
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
        id: "spot-clusters",
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#f472b6",
          "circle-radius": [
            "step",
            ["get", "point_count"],
            16,
            25,
            22,
            100,
            28,
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff7fb",
        },
      });
      map.addLayer({
        id: "spot-cluster-count",
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
        id: "spot-points",
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "case",
            ["==", ["get", "fav"], 1],
            "#67e8f9",
            "#fb7185",
          ],
          "circle-radius": 6,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#fff7fb",
        },
      });
      const pointCursor = (cursor: string) => {
        map.getCanvas().style.cursor = cursor;
      };
      map.on("mouseenter", "spot-clusters", () => pointCursor("pointer"));
      map.on("mouseleave", "spot-clusters", () => pointCursor(""));
      map.on("mouseenter", "spot-points", () => pointCursor("pointer"));
      map.on("mouseleave", "spot-points", () => pointCursor(""));
      map.on("click", "spot-clusters", (event) => {
        const feature = event.features?.[0];
        if (feature?.geometry.type !== "Point") return;
        const clusterId = Number(feature.properties?.cluster_id);
        if (!Number.isFinite(clusterId)) return;
        const source = geoJsonSource(map);
        if (!source) return;
        const center = feature.geometry.coordinates;
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        void Promise.resolve(source.getClusterExpansionZoom(clusterId)).then(
          (zoom) => {
            map.easeTo({
              center: [center[0] ?? 0, center[1] ?? 0],
              zoom,
              duration: reduce ? 0 : 400,
            });
          },
        );
      });
      map.on("click", "spot-points", (event) => {
        const feature = event.features?.[0];
        if (feature?.geometry.type !== "Point") return;
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;
        showSpotPopup(map, popupRef, locale, {
          id: String(props?.id ?? ""),
          subjectId: String(props?.subjectId ?? ""),
          name: String(props?.name ?? ""),
          anime: String(props?.anime ?? ""),
          lng: lng ?? 0,
          lat: lat ?? 0,
        });
      });
      mapRef.current = map;
      setMapLoaded(true);
      map.resize();
    });
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      popupRef.current = null;
      setMapLoaded(false);
    };
  }, [attempt, locale]);

  const favoriteKey = favorites.ids.join("\0");

  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoaded || !map || !catalog || !favorites.ready) return;
    const source = geoJsonSource(map);
    if (!source) return;
    const favoriteSet = new Set(favorites.ids);
    const spots = filterNavSpots(catalog.spots, {
      subjectId,
      locationSlug,
      favoriteIds: favorites.ids,
      favoritesOnly: favoritesOnly && !subjectId,
    });
    setVisibleCount(spots.length);
    source.setData({
      type: "FeatureCollection",
      features: spots.map((spot) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [spot.lng, spot.lat],
        },
        properties: {
          id: spot.id,
          subjectId: spot.subjectId,
          fav: favoriteSet.has(spot.subjectId) ? 1 : 0,
          name: localizedNavText(spot.name, locale),
          anime: animeTitle(catalog.animes, spot.subjectId, locale),
        },
      })),
    });
    const fitKey = `${subjectId ?? ""}|${locationSlug ?? ""}|${favoritesOnly}|${spots.length}`;
    if (fittedKey.current === fitKey) return;
    fittedKey.current = fitKey;
    if (!subjectId && !locationSlug && !favoritesOnly) {
      map.fitBounds(JAPAN_BOUNDS, { padding: 24, animate: false });
      return;
    }
    const bounds = boundsFor(spots);
    if (bounds) {
      map.fitBounds(bounds, { padding: 36, maxZoom: 13, animate: false });
    }
  }, [
    catalog,
    favoriteKey,
    favorites.ids,
    favorites.ready,
    favoritesOnly,
    locale,
    locationSlug,
    mapLoaded,
    subjectId,
  ]);

  const showFavoriteToggle =
    favorites.ready && favorites.ids.length > 0 && !subjectId;
  const waiting = !error && (!catalog || !mapLoaded || !favorites.ready);

  return (
    <div
      className="pilgrimage-map relative h-full w-full"
      data-testid="pilgrimage-map"
    >
      <div
        ref={containerRef}
        className="h-full w-full"
        role="application"
        aria-label={copy.mapTitle}
      />
      {showFavoriteToggle ? (
        <div className="absolute top-3 left-3 z-10 flex max-w-[70%] flex-wrap gap-2">
          <FilterButton
            pressed={favoritesOnly}
            onClick={() => setFavoritesOnly(true)}
            label={copy.mapShowFavorites}
          />
          <FilterButton
            pressed={!favoritesOnly}
            onClick={() => setFavoritesOnly(false)}
            label={copy.mapShowAll}
          />
        </div>
      ) : null}
      {visibleCount === 0 && !waiting && !error ? (
        <p className="absolute bottom-8 left-3 z-10 max-w-[70%] rounded-lg bg-[#0a0612]/80 px-3 py-2 text-xs text-pink-50">
          {copy.mapEmpty}
        </p>
      ) : null}
      {waiting || error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0612]/70 p-4 text-center text-sm text-pink-100/80">
          {error ? (
            <button
              type="button"
              className="anime-button px-4 py-2 text-sm"
              onClick={() => {
                setError(false);
                setAttempt((value) => value + 1);
              }}
            >
              {copy.mapUnavailable}
            </button>
          ) : (
            <span>{copy.mapLoading}</span>
          )}
        </div>
      ) : null}
    </div>
  );
}

function geoJsonSource(map: maplibregl.Map): maplibregl.GeoJSONSource | null {
  const source = map.getSource(SOURCE_ID);
  if (source?.type !== "geojson") return null;
  // MapLibre's Source union does not narrow on `type`.
  return source as maplibregl.GeoJSONSource;
}

function FilterButton({
  pressed,
  onClick,
  label,
}: {
  pressed: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={
        pressed
          ? "anime-button px-3 py-2 text-xs"
          : "anime-button-secondary px-3 py-2 text-xs"
      }
    >
      {label}
    </button>
  );
}

function boundsFor(spots: readonly NavSpot[]) {
  const bounds = new maplibregl.LngLatBounds();
  let count = 0;
  for (const spot of spots) {
    if (spot.lng < 120 || spot.lng > 155 || spot.lat < 20 || spot.lat > 50) {
      continue;
    }
    bounds.extend([spot.lng, spot.lat]);
    count += 1;
  }
  return count > 0 ? bounds : null;
}

function popupAction(href: string, label: string): HTMLAnchorElement {
  const link = document.createElement("a");
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = label;
  link.style.display = "inline-block";
  link.style.fontWeight = "800";
  link.style.color = "#0a0612";
  link.style.background = "#f9a8d4";
  link.style.borderRadius = "8px";
  link.style.padding = "6px 10px";
  return link;
}

function showSpotPopup(
  map: maplibregl.Map,
  popupRef: { current: maplibregl.Popup | null },
  locale: PilgrimageLocale,
  spot: {
    id: string;
    subjectId: string;
    name: string;
    anime: string;
    lat: number;
    lng: number;
  },
) {
  const copy = getPilgrimageCopy(locale);
  const root = document.createElement("div");
  const title = document.createElement("a");
  title.href = withPilgrimageLocale(
    `/pilgrimage/spots/${encodeSpotId(spot.id)}`,
    locale,
  );
  title.textContent = spot.name || spot.id;
  title.className = "pilgrimage-popup-link";
  root.append(title);
  if (spot.anime) {
    const meta = document.createElement("p");
    meta.textContent = spot.anime;
    meta.style.margin = "4px 0 0";
    meta.style.fontSize = "12px";
    meta.style.color = "rgba(252, 231, 243, 0.75)";
    root.append(meta);
  }
  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.flexWrap = "wrap";
  actions.style.gap = "8px";
  actions.style.marginTop = "8px";
  actions.append(
    popupAction(googleMapsDirectionsUrl(spot.lat, spot.lng), copy.navigate),
    popupAction(googleStreetViewUrl(spot.lat, spot.lng), copy.streetView),
  );
  root.append(actions);
  popupRef.current?.remove();
  const popup = new maplibregl.Popup({ offset: 12, maxWidth: "240px" })
    .setLngLat([spot.lng, spot.lat])
    .setDOMContent(root)
    .addTo(map);
  popupRef.current = popup;
}
