import knownSlugs from "~/lib/pilgrimage-known-slugs.json";

const publishedLocations = new Set(knownSlugs.location);

/**
 * Area pages are municipality slugs (`chiba-chiba-12106`), not prefectures.
 * There is no parent prefecture route to send an empty page to.
 */
export function parentAreaSlug(_locationSlug: string): string | null {
  return null;
}

export function emptyAreaOutcome(
  locationSlug: string,
): { kind: "not-found" } | { kind: "redirect"; slug: string } {
  const parent = parentAreaSlug(locationSlug);
  if (parent && parent !== locationSlug && publishedLocations.has(parent)) {
    return { kind: "redirect", slug: parent };
  }
  return { kind: "not-found" };
}
