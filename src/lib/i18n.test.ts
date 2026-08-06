import { describe, expect, it } from "vitest";
import { fill, localizedCount, translate, type Locale } from "./i18n";

describe("translate", () => {
  it("returns English text unchanged for the en locale", () => {
    expect(translate("en", "Sign out")).toBe("Sign out");
  });

  it("returns the Korean translation for a known string", () => {
    expect(translate("ko", "Sign out")).toBe("로그아웃");
  });

  it("falls back to the original English text for an unknown string", () => {
    expect(translate("ko", "Some brand-new UI string")).toBe("Some brand-new UI string");
  });

  it.each(["zh", "ja", "es"] as Locale[])("translates a known string for %s", (locale) => {
    const translated = translate(locale, "Sign out");
    expect(translated).not.toBe("Sign out");
    expect(translated.length).toBeGreaterThan(0);
  });

  it.each(["zh", "ja", "es"] as Locale[])("falls back to English for an unknown string in %s", (locale) => {
    expect(translate(locale, "Some brand-new UI string")).toBe("Some brand-new UI string");
  });
});

describe("localizedCount", () => {
  it("appends a counter word for Korean, Chinese, and Japanese", () => {
    expect(localizedCount("ko", 3)).toBe("3개");
    expect(localizedCount("zh", 3)).toBe("3个");
    expect(localizedCount("ja", 3)).toBe("3個");
  });

  it("uses the plain number for English and Spanish", () => {
    expect(localizedCount("en", 3)).toBe("3");
    expect(localizedCount("es", 3)).toBe("3");
  });
});

describe("fill", () => {
  it("substitutes a single placeholder", () => {
    expect(fill("Uploaded {time}", { time: "yesterday" })).toBe("Uploaded yesterday");
  });

  it("substitutes multiple distinct placeholders", () => {
    expect(fill("{used} / {quota} used", { used: "1GB", quota: "5GB" })).toBe("1GB / 5GB used");
  });

  it("substitutes every occurrence of a repeated placeholder", () => {
    expect(fill("{name} and {name} again", { name: "Roun" })).toBe("Roun and Roun again");
  });

  it("leaves the text unchanged when there are no placeholders to fill", () => {
    expect(fill("No placeholders here", {})).toBe("No placeholders here");
  });
});
