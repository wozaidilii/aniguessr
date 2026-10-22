import packed from "~/lib/pilgrimage-known-spot-ids.json";

const OFFSET = 0xcbf29ce484222325n;
const PRIME = 0x100000001b3n;
const MASK = 0xffffffffffffffffn;

/** FNV-1a 64-bit, lowercase hex. Keep in sync with scripts/lib/known-spot-id.mjs. */
export function fnv1a64Hex(value: string): string {
  let hash = OFFSET;
  const bytes = new TextEncoder().encode(value);
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = (hash * PRIME) & MASK;
  }
  return hash.toString(16).padStart(16, "0");
}

const PACK = packed.hex;

/** True when this spot id is in the SEO index, including ids that redirect. */
export function isKnownSpotId(id: string): boolean {
  if (!id || PACK.length < 16) return false;
  const hash = fnv1a64Hex(id);
  let lo = 0;
  let hi = PACK.length / 16;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const slice = PACK.slice(mid * 16, mid * 16 + 16);
    if (slice === hash) return true;
    if (slice < hash) lo = mid + 1;
    else hi = mid;
  }
  return false;
}
