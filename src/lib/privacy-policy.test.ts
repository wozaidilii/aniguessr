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
      expect(markdown).not.toContain("/photo-terms");
      expect(markdown).not.toMatch(/exif/i);
      expect(markdown).not.toMatch(/写真|投稿照片|照片投稿/);
      expect(markdown).not.toMatch(/photo submission/i);
      expect(markdown).toContain("support@ayiora.com");
      expect(markdown).toContain(
        locale === "en" ? "October 21, 2026" : "2026年10月21日",
      );
      expect(markdown).toContain(
        locale === "en"
          ? "Revised: October 29, 2026"
          : locale === "ja"
            ? "改定日：2026年10月29日"
            : "改定日期：2026年10月29日",
      );
      expect(markdown).toMatch(/アフィリエイト|联盟链接|聯盟連結|Affiliate links/u);
      expect(privacyTitle(locale).length).toBeGreaterThan(0);
      expect(
        parsePrivacyDocument(markdown).some((block) => block.type === "table"),
      ).toBe(true);
    },
  );

  it("keeps the 30-day deletion request and drops photo sections", () => {
    const ja = privacyMarkdown("ja");
    const en = privacyMarkdown("en");
    expect(ja).toContain("30日以内");
    expect(en).toContain("within 30 days");
    expect(privacyMarkdown("zh")).toContain("30 天内");
    expect(privacyMarkdown("zh-tw")).toContain("30 日內");
    expect(ja).toContain("### 3.4 お問い合わせ・申立ての際に取得する情報");
    expect(ja).toContain("### 3.5 運営者が取得しない情報");
    expect(ja).not.toContain("### 3.6");
    expect(en).toContain("### 3.4 When you contact us or file a notice");
    expect(en).toContain("### 3.5 Information we do not collect");
    expect(en).not.toContain("### 3.6");
    expect(en).toContain("## 12. Requests for disclosure and other actions");
  });

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
