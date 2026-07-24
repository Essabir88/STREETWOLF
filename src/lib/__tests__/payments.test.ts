import { describe, it, expect } from "vitest";
import { PAYMENT_METHODS } from "@/lib/payments";

describe("PAYMENT_METHODS", () => {
  it("only lists cash-on-delivery, and it's available", () => {
    expect(PAYMENT_METHODS).toEqual([{ id: "cod", available: true }]);
  });
});
