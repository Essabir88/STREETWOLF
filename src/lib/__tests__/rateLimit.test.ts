import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkRateLimit, resetRateLimits } from "@/lib/rateLimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimits();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("key", 5, 60_000).allowed).toBe(true);
    }
  });

  it("blocks once the limit is exceeded within the window", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("key", 5, 60_000);
    const result = checkRateLimit("key", 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets once the window elapses", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("key", 5, 60_000);
    expect(checkRateLimit("key", 5, 60_000).allowed).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(checkRateLimit("key", 5, 60_000).allowed).toBe(true);
  });

  it("tracks separate keys independently", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("a", 5, 60_000);
    expect(checkRateLimit("a", 5, 60_000).allowed).toBe(false);
    expect(checkRateLimit("b", 5, 60_000).allowed).toBe(true);
  });
});
