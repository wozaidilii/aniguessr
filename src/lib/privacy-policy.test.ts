import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parsePrivacyDocument, privacyPlainText } from "~/lib/privacy-document";
import {
  pickPrivacySource,
  privacyLocaleChain,
  privacyMarkdown,
  privacyTitle,
  stripHtmlComments,
} from "~/lib/privacy-policy";

const LEGAL_ENTITY =
  /株式会社|合同会社|有限会社|Inc\.|LLC|Ltd\.|Co\., Ltd|法人名/u;

describe("privacy policy text", () => {
  it("strips HTML comments before they can reach the page", () => {
    const source = "Hello <!-- secret --> world <!--\nBEGIN locale: ja\n-->";
    expect(stripHtmlComments(source)).toBe("Hello  world ");
    expect(stripHtmlComments(source)).not.toContain("<!--");
  });

  it("falls zh-TW back to simplified Chinese, then English", () => {
    expect(privacyLocaleChain("zh-tw")).toEqual(["zh-tw", "zh", "en"]);
    expect(
      pickPrivacySource("zh-tw", {
        zh: "简体正文",
        en: "English body",
      }),
    ).toBe("简体正文\n");
    expect(
      pickPrivacySource("zh-tw", {
        "zh-tw": "<!-- hide -->",
        zh: "",
        en: "English body",
      }),
    ).toBe("English body\n");
  });

  it.each(["ja", "zh", "zh-tw", "en"] as const)(
    "publishes %s without comments, placeholders, or a legal entity name",
    (locale) => {
      const markdown = privacyMarkdown(locale);
      const plain = privacyPlainText(markdown);
      expect(markdown).not.toContain("<!--");
      expect(markdown).not.toContain("{locale}");
      expect(markdown).not.toContain("{EFFECTIVE_DATE}");
      expect(markdown).not.toContain("{PRIVACY_URL}");
      expect(plain).not.toMatch(LEGAL_ENTITY);
      expect(markdown).toContain(`/${locale}/photo-terms`);
      expect(markdown).toContain("rights@ayiora.com");
      expect(markdown).toContain(
        locale === "en" ? "October 21, 2026" : "2026年10月21日",
      );
      expect(privacyTitle(locale).length).toBeGreaterThan(0);
      expect(
        parsePrivacyDocument(markdown).some((block) => block.type === "table"),
      ).toBe(true);
    },
  );

  it("states the operator without naming a company in Japanese", () => {
    const plain = privacyPlainText(privacyMarkdown("ja"));
    expect(plain).toContain("運営者");
    expect(plain).toContain("本サービスの運営者");
    expect(plain).not.toContain("メールアドレス、表示名");
    expect(plain).toContain("アカウントIDをあわせて連携します");
  });

  it("keeps the deletion trigger that removes activity rows by email", () => {
    const schema = readFileSync("db/schema.sql", "utf8");
    expect(schema).toContain("lower(email) = lower(btrim(old.email))");
    expect(schema).toContain("players_delete_personal_rows");
    expect(schema).toContain("before delete on players");
  });
});
