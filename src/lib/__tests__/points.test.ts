import { describe, it, expect } from "vitest";
import { formatPrice, pointsForTotal, pointsToDiscountCents } from "@/lib/points";

describe("formatPrice", () => {
  it("formats in French with the DH suffix by default", () => {
    expect(formatPrice(27900)).toBe("279,00 DH");
  });

  it("formats in English with the MAD suffix", () => {
    expect(formatPrice(27900, "en")).toBe("279.00 MAD");
  });

  it("formats in Arabic with Western digits, not Arabic-Indic ones", () => {
    const result = formatPrice(27900, "ar");
    expect(result).not.toMatch(/[٠-٩]/);
    expect(result).toContain("279");
  });

  it("never changes the underlying amount across locales", () => {
    // Compare digit sequences only (not full parsing) so this doesn't
    // depend on which grouping/decimal separator glyphs a given locale
    // uses — only that the amount itself isn't altered or converted.
    const cents = 123456;
    const digitsOnly = (s: string) => s.replace(/\D/g, "");
    const results = (["fr", "en", "ar"] as const).map((locale) =>
      digitsOnly(formatPrice(cents, locale))
    );
    for (const r of results) expect(r).toBe("123456");
  });
});

describe("pointsForTotal / pointsToDiscountCents", () => {
  it("round-trips a whole-MAD amount at the default rates", () => {
    expect(pointsForTotal(10000)).toBe(100);
    expect(pointsToDiscountCents(100)).toBe(1000);
  });
});
