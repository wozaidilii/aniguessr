import { COUNTRY_OPTIONS } from "~/lib/country";

const FLAG_EMOJI =
  /[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F3}\uFE0F?/u;

export interface ProfileRegionOption {
  value: string;
  label: string;
}

function regionLabel(displayNames: Intl.DisplayNames, code: string): string {
  return displayNames.of(code) ?? code;
}

/** Build profile region `<select>` options: unset, Japan second, then sorted regions (no flags). */
export function buildProfileRegionOptions(
  uiLocale: string,
  countryUnsetLabel: string,
): ProfileRegionOption[] {
  const displayNames = new Intl.DisplayNames([uiLocale], { type: "region" });
  const collator = new Intl.Collator(uiLocale);
  const codes = COUNTRY_OPTIONS.map((item) => item.code).filter(
    (code) => code !== "JP",
  );
  codes.sort((a, b) =>
    collator.compare(regionLabel(displayNames, a), regionLabel(displayNames, b)),
  );

  const options: ProfileRegionOption[] = [
    { value: "", label: countryUnsetLabel },
    { value: "JP", label: regionLabel(displayNames, "JP") },
    ...codes.map((code) => ({
      value: code,
      label: regionLabel(displayNames, code),
    })),
  ];

  for (const option of options) {
    if (FLAG_EMOJI.test(option.label)) {
      throw new Error(`Region label must not contain flag emoji: ${option.label}`);
    }
  }

  return options;
}
