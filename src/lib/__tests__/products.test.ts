import { describe, it, expect } from "vitest";
import { resolveLocalized } from "@/lib/products";

describe("resolveLocalized", () => {
  it("returns the requested locale when present", () => {
    expect(resolveLocalized({ fr: "Bonjour", en: "Hello", ar: "مرحبا" }, "en")).toBe(
      "Hello"
    );
  });

  it("falls back to French when the requested locale is empty", () => {
    expect(resolveLocalized({ fr: "Bonjour", en: "", ar: "مرحبا" }, "en")).toBe(
      "Bonjour"
    );
  });

  it("falls back to French when the requested locale is whitespace-only", () => {
    expect(resolveLocalized({ fr: "Bonjour", en: "   ", ar: "مرحبا" }, "en")).toBe(
      "Bonjour"
    );
  });

  it("returns an empty string when both the locale and the fallback are empty", () => {
    expect(resolveLocalized({ fr: "", en: "", ar: "" }, "en")).toBe("");
  });
});
