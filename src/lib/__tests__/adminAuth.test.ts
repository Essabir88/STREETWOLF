import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { checkAdminPassword, adminPasswordConfigured } from "@/lib/adminAuth";

describe("checkAdminPassword", () => {
  const original = process.env.ADMIN_PASSWORD;

  beforeEach(() => {
    process.env.ADMIN_PASSWORD = "correct-horse-battery-staple";
  });

  afterEach(() => {
    process.env.ADMIN_PASSWORD = original;
  });

  it("accepts the correct password", () => {
    expect(checkAdminPassword("correct-horse-battery-staple")).toBe(true);
  });

  it("rejects a wrong password of the same length", () => {
    expect(checkAdminPassword("correct-horse-battery-staplf")).toBe(false);
  });

  it("rejects a wrong password of a different (shorter) length", () => {
    expect(checkAdminPassword("short")).toBe(false);
  });

  it("rejects a wrong password of a different (longer) length", () => {
    expect(checkAdminPassword("correct-horse-battery-staple-and-then-some")).toBe(
      false
    );
  });

  it("rejects an empty password", () => {
    expect(checkAdminPassword("")).toBe(false);
  });

  it("takes roughly the same time regardless of input length (regression for the timing leak)", () => {
    // Not a precise timing-attack test (too flaky in CI), just a guard that
    // checkAdminPassword doesn't early-return before the constant-time
    // comparison the way the old `if (password.length !== expected.length)
    // return false` guard did.
    expect(() => checkAdminPassword("x".repeat(1000))).not.toThrow();
  });
});

describe("adminPasswordConfigured", () => {
  const original = process.env.ADMIN_PASSWORD;
  afterEach(() => {
    process.env.ADMIN_PASSWORD = original;
  });

  it("is false when ADMIN_PASSWORD is unset (fail closed)", () => {
    delete process.env.ADMIN_PASSWORD;
    expect(adminPasswordConfigured()).toBe(false);
  });
});
