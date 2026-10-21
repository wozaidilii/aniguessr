import spotNameOverridesJson from "../../scripts/data/spot-name-overrides.json";
import { jaSpotPlaceOverride } from "~/lib/ja-place-overrides";
import {
  pickSpotPlaceFromRecord,
  type LocalizedText,
} from "~/lib/localized-text";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";

interface SpotNameOverride {
  name?: string;
}

const NAME_LOCALES = ["ja", "zh", "zh-tw", "en"] as const;

/**
 * Per-spot display names. Keyed by locale, then spot id. A filled name
 * replaces the resolved place everywhere that place is shown. Locales
 * omitted from the file keep the existing resolver, including the
 * Japanese place override.
 */
const SPOT_NAME_OVERRIDES: Partial<
  Record<string, Record<string, SpotNameOverride>>
> = spotNameOverridesJson;

export interface LocaleNameSet {
  ja: string;
  zh: string;
  "zh-tw": string;
  en: string;
}

export function spotDisplayNameOverride(
  locale: PilgrimageLocale,
  spotId: string,
): string | undefined {
  return filled(SPOT_NAME_OVERRIDES[locale]?.[spotId]?.name);
}

export function applySpotDisplayName(
  locale: PilgrimageLocale,
  spotId: string,
  name: string,
): string {
  return spotDisplayNameOverride(locale, spotId) ?? name;
}

/** Resolved place, then this file. Japanese stays on the existing resolver. */
export function spotPlaceName(
  spot: {
    id: string;
    answerName: Partial<LocalizedText> | null | undefined;
    title: Partial<LocalizedText> | null | undefined;
  },
  locale: PilgrimageLocale,
): string {
  return applySpotDisplayName(
    locale,
    spot.id,
    pickSpotPlaceFromRecord(
      spot.answerName,
      spot.title,
      locale,
      jaSpotPlaceOverride(spot.id),
    ),
  );
}

/** Share-card names. An override wins over og_title and short_name too. */
export function withSpotDisplayNames(
  names: LocaleNameSet,
  spotId: string,
): LocaleNameSet {
  const next = { ...names };
  for (const locale of NAME_LOCALES) {
    const override = spotDisplayNameOverride(locale, spotId);
    if (override) next[locale] = override;
  }
  return next;
}

export function clearOverriddenSpotAliases(
  names: LocaleNameSet | undefined,
  spotId: string,
): LocaleNameSet | undefined {
  if (!names) return undefined;
  const next = { ...names };
  let changed = false;
  for (const locale of NAME_LOCALES) {
    if (!spotDisplayNameOverride(locale, spotId) || !next[locale]) continue;
    next[locale] = "";
    changed = true;
  }
  return changed ? next : names;
}

function filled(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed;
}
