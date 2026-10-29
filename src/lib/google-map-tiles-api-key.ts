/** Map Tiles API key (referrer-restricted); falls back to the JS API key. */
export function resolveGoogleMapTilesApiKey(): string | undefined {
  const tilesKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY;
  if (tilesKey) return tilesKey;
  return process.env.NEXT_PUBLIC_GOOGLE_MAP_AK;
}
