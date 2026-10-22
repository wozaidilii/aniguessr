import { describe, expect, it, vi } from "vitest";
import { DEFAULT_FOREIGN_COUNTRY, type LatLng } from "./foreign-map";
import {
  MIN_RESULT_BOUNDS_SPAN_DEG,
  resetGoogleGuessMapView,
  ROUND_RESULT_FIT_BOUNDS_PADDING,
  syncGoogleGuessMapViewport,
} from "./google-guess-map-view";
import type {
  GoogleLatLngBoundsInstance,
  GoogleMapInstance,
  GoogleMapsApi,
} from "./google-street-view";

class MockLatLngBounds implements GoogleLatLngBoundsInstance {
  readonly points: LatLng[] = [];

  extend(point: LatLng) {
    this.points.push(point);
  }
}

function makeMap() {
  const fitBounds = vi.fn();
  const panTo = vi.fn();
  const setCenter = vi.fn();
  const setZoom = vi.fn();
  const map: GoogleMapInstance = {
    addListener: vi.fn(() => ({ remove: vi.fn() })),
    fitBounds,
    panTo,
    setCenter,
    setZoom,
  };

  return { fitBounds, map, panTo, setCenter, setZoom };
}

const api = {
  LatLngBounds: MockLatLngBounds,
} satisfies Pick<GoogleMapsApi, "LatLngBounds">;

describe("google guess map viewport sync", () => {
  it("fits the map to the guess and answer during a result", () => {
    const { fitBounds, map, setCenter, setZoom } = makeMap();
    const guess = { lat: 35.7, lng: 139.7 };
    const answer = { lat: 35.6, lng: 139.8 };

    syncGoogleGuessMapViewport({
      map,
      api,
      country: DEFAULT_FOREIGN_COUNTRY,
      restrictToCountry: true,
      guess,
      answer,
    });

    expect(fitBounds).toHaveBeenCalledTimes(1);
    expect(fitBounds.mock.calls[0]?.[0]).toMatchObject({
      points: [guess, answer],
    });
    expect(setCenter).not.toHaveBeenCalled();
    expect(setZoom).not.toHaveBeenCalled();
  });

  it("resets to the country overview after the result is cleared for the next round", () => {
    const { map, setCenter, setZoom } = makeMap();

    syncGoogleGuessMapViewport({
      map,
      api,
      country: DEFAULT_FOREIGN_COUNTRY,
      restrictToCountry: true,
      guess: null,
      answer: null,
    });

    expect(setCenter).toHaveBeenCalledWith(DEFAULT_FOREIGN_COUNTRY.center);
    expect(setZoom).toHaveBeenCalledWith(DEFAULT_FOREIGN_COUNTRY.zoom);
  });

  it("does not reset the viewport when a player has only placed a guess", () => {
    const { fitBounds, map, panTo, setCenter, setZoom } = makeMap();

    syncGoogleGuessMapViewport({
      map,
      api,
      country: DEFAULT_FOREIGN_COUNTRY,
      restrictToCountry: true,
      guess: { lat: 34.7, lng: 135.5 },
      answer: null,
    });

    expect(fitBounds).not.toHaveBeenCalled();
    expect(panTo).not.toHaveBeenCalled();
    expect(setCenter).not.toHaveBeenCalled();
    expect(setZoom).not.toHaveBeenCalled();
  });

  it("insets a round-result fit so pins clear the legend and controls", () => {
    const { fitBounds, map, setZoom } = makeMap();
    const guess = { lat: 35.7, lng: 139.7 };
    const answer = { lat: 35.6, lng: 139.8 };

    syncGoogleGuessMapViewport({
      map,
      api,
      country: DEFAULT_FOREIGN_COUNTRY,
      restrictToCountry: true,
      guess,
      answer,
      boundsPadding: ROUND_RESULT_FIT_BOUNDS_PADDING,
    });

    expect(fitBounds).toHaveBeenCalledTimes(1);
    expect(fitBounds.mock.calls[0]?.[0]).toMatchObject({
      points: [guess, answer],
    });
    expect(fitBounds.mock.calls[0]?.[1]).toEqual({
      top: 114,
      right: 64,
      bottom: 40,
      left: 24,
    });
    expect(setZoom).not.toHaveBeenCalled();
  });

  it("expands a single-point result so zoom stays off the maximum", () => {
    const { fitBounds, map, setZoom } = makeMap();
    const point = { lat: 35.681, lng: 139.767 };

    syncGoogleGuessMapViewport({
      map,
      api,
      country: DEFAULT_FOREIGN_COUNTRY,
      restrictToCountry: true,
      guess: point,
      answer: point,
      boundsPadding: ROUND_RESULT_FIT_BOUNDS_PADDING,
    });

    const bounds = fitBounds.mock.calls[0]?.[0] as MockLatLngBounds;
    const lats = bounds.points.map((item) => item.lat);
    const lngs = bounds.points.map((item) => item.lng);
    expect(Math.max(...lats) - Math.min(...lats)).toBeCloseTo(
      MIN_RESULT_BOUNDS_SPAN_DEG,
    );
    expect(Math.max(...lngs) - Math.min(...lngs)).toBeCloseTo(
      MIN_RESULT_BOUNDS_SPAN_DEG,
    );
    expect((Math.max(...lats) + Math.min(...lats)) / 2).toBeCloseTo(point.lat);
    expect((Math.max(...lngs) + Math.min(...lngs)) / 2).toBeCloseTo(point.lng);
    expect(lats.some((lat) => lat < point.lat)).toBe(true);
    expect(lats.some((lat) => lat > point.lat)).toBe(true);
    expect(setZoom).not.toHaveBeenCalled();
    expect(fitBounds.mock.calls[0]?.[1]).toEqual(ROUND_RESULT_FIT_BOUNDS_PADDING);
  });

  it("keeps a wide separation and only widens a collapsed axis", () => {
    const { fitBounds, map } = makeMap();
    const guess = { lat: 35, lng: 139 };
    const answer = { lat: 36, lng: 139 };

    syncGoogleGuessMapViewport({
      map,
      api,
      country: DEFAULT_FOREIGN_COUNTRY,
      restrictToCountry: true,
      guess,
      answer,
    });

    const bounds = fitBounds.mock.calls[0]?.[0] as MockLatLngBounds;
    const lats = bounds.points.map((item) => item.lat);
    const lngs = bounds.points.map((item) => item.lng);
    expect(Math.max(...lats) - Math.min(...lats)).toBeCloseTo(1);
    expect(Math.max(...lngs) - Math.min(...lngs)).toBeCloseTo(
      MIN_RESULT_BOUNDS_SPAN_DEG,
    );
    expect(fitBounds.mock.calls[0]?.[1]).toBeUndefined();
  });

  it("falls back to panTo when the map wrapper lacks setCenter", () => {
    const { map, panTo, setZoom } = makeMap();
    map.setCenter = undefined;

    resetGoogleGuessMapView(map, DEFAULT_FOREIGN_COUNTRY, true);

    expect(panTo).toHaveBeenCalledWith(DEFAULT_FOREIGN_COUNTRY.center);
    expect(setZoom).toHaveBeenCalledWith(DEFAULT_FOREIGN_COUNTRY.zoom);
  });
});
