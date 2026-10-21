export const HOME_ORIGIN_EVENT = "aniguessr:home-origin";
export const HOME_BOUNDS_EVENT = "aniguessr:home-bounds";

export interface HomeOriginDetail {
  lat: number;
  lng: number;
}

export interface HomeBoundsDetail {
  west: number;
  south: number;
  east: number;
  north: number;
  lat: number;
  lng: number;
}
