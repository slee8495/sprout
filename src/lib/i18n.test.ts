import { describe, expect, it } from "vitest";
import { fill, translate } from "./i18n";

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
