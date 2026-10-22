const OFFSET = 0xcbf29ce484222325n;
const PRIME = 0x100000001b3n;
const MASK = 0xffffffffffffffffn;

/** FNV-1a 64-bit, lowercase hex. Keep in sync with src/lib/known-spot-id.ts. */
export function fnv1a64Hex(value) {
  let hash = OFFSET;
  const bytes = new TextEncoder().encode(value);
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = (hash * PRIME) & MASK;
  }
  return hash.toString(16).padStart(16, "0");
}

/** Sorted 16-char hashes, concatenated. Middleware binary-searches this string. */
export function packKnownSpotIds(ids) {
  const unique = [...new Set(ids.filter((id) => typeof id === "string" && id))];
  const hex = unique.map((id) => fnv1a64Hex(id)).sort().join("");
  return { n: unique.length, hex };
}
