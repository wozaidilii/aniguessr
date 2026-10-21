/**
 * Manual Japanese place labels. Used only when `answerName.ja` is empty.
 * Authored Japanese still wins; see `japanesePlaceLabel`.
 */
export const JA_SPOT_PLACE_OVERRIDES: Readonly<Record<string, string>> = {
  anitabi_101399_51i525idi: "竹下通り入口（原宿）",
};

export function jaSpotPlaceOverride(spotId: string): string | undefined {
  return JA_SPOT_PLACE_OVERRIDES[spotId];
}
