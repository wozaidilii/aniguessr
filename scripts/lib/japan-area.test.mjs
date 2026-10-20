import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadMunicipalities, locateMunicipality } from "./japan-area.mjs";

loadMunicipalities(
  path.join(process.cwd(), "scripts/data/japan-municipalities.json"),
);

describe("Japan municipality reverse geocoding", () => {
  it("places Enoshima in Fujisawa, not Kamakura", () => {
    const place = locateMunicipality(139.4806, 35.2998);
    expect(place?.code).toBe("14205");
    expect(place?.ja).toBe("藤沢市");
    expect(place?.slug).toBe("fujisawa-kanagawa");
  });

  it("places the Tokyo metropolitan government in Shinjuku", () => {
    const place = locateMunicipality(139.6917, 35.6895);
    expect(place?.code).toBe("13104");
    expect(place?.ja).toContain("新宿");
  });

  it("keeps central Takayama in Takayama", () => {
    const place = locateMunicipality(137.2521, 36.1408);
    expect(place?.code).toBe("21203");
    expect(place?.ja).toContain("高山");
  });

  it("places Kamakura station in Kamakura", () => {
    const place = locateMunicipality(139.5503, 35.3192);
    expect(place?.code).toBe("14204");
    expect(place?.ja).toBe("鎌倉市");
  });
});
