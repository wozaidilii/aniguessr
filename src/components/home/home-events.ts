export const HOME_ORIGIN_EVENT = "aniguessr:home-origin";
export const HOME_BOUNDS_EVENT = "aniguessr:home-bounds";
export const HOME_FOCUS_WORK_EVENT = "aniguessr:home-focus-work";
/** User drag or zoom on the homepage map. */
export const HOME_MAP_GESTURE_EVENT = "aniguessr:home-map-gesture";

export function signalHomeMapGesture(): void {
  window.dispatchEvent(new CustomEvent(HOME_MAP_GESTURE_EVENT));
}

export interface HomeOriginDetail {
  lat: number;
  lng: number;
  /** Move to the origin without changing the current zoom. */
  keepZoom?: boolean;
}

export interface HomeFocusWorkDetail {
  subjectId: string | null;
}

export interface HomeBoundsDetail {
  west: number;
  south: number;
  east: number;
  north: number;
  lat: number;
  lng: number;
}
