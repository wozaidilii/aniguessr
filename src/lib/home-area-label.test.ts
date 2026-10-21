import { describe, expect, it } from "vitest";
import { dropDistrictPrefix } from "~/lib/home-area-label";

describe("work-card district labels", () => {
  it("drops a 郡 before a town or village in every locale string", () => {
    expect(dropDistrictPrefix("南巨摩郡身延町")).toBe("身延町");
    expect(dropDistrictPrefix("宮城郡松島町")).toBe("松島町");
    expect(dropDistrictPrefix("山梨県南巨摩郡身延町")).toBe("身延町");
    expect(dropDistrictPrefix("西多摩郡檜原村")).toBe("檜原村");
  });

  it("leaves city names that contain 郡", () => {
    expect(dropDistrictPrefix("郡山市")).toBe("郡山市");
    expect(dropDistrictPrefix("蒲郡市")).toBe("蒲郡市");
    expect(dropDistrictPrefix("郡上市")).toBe("郡上市");
    expect(dropDistrictPrefix("藤沢市")).toBe("藤沢市");
    expect(dropDistrictPrefix("鎌倉")).toBe("鎌倉");
  });

  it("drops an English district marker and keeps the prefecture", () => {
    expect(dropDistrictPrefix("Kamikawa-gun (Ishikari), Hokkaido")).toBe(
      "Kamikawa (Ishikari), Hokkaido",
    );
    expect(dropDistrictPrefix("Nishitama District, Tokyo")).toBe(
      "Nishitama, Tokyo",
    );
    expect(dropDistrictPrefix("Kamakura, Kanagawa")).toBe("Kamakura, Kanagawa");
  });
});
