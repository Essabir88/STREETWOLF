import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  checkoutSchema,
} from "@/lib/validation";

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "0600000000",
      password: "longenough",
    });
    expect(result.success).toBe(true);
  });

  it("returns the invalid_email code, not free text, for a bad email", () => {
    const result = registerSchema.safeParse({
      name: "Jane Doe",
      email: "not-an-email",
      password: "longenough",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("invalid_email");
    }
  });

  it("returns the password_too_short code for a short password", () => {
    const result = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("password_too_short");
    }
  });
});

describe("loginSchema", () => {
  it("returns password_required for an empty password", () => {
    const result = loginSchema.safeParse({ email: "jane@example.com", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("password_required");
    }
  });
});

describe("checkoutSchema", () => {
  it("requires a supported locale", () => {
    const result = checkoutSchema.safeParse({
      items: [{ productId: "p1", quantity: 1 }],
      shipping: {
        name: "Jane Doe",
        phone: "0600000000",
        address: "1 rue Test",
        city: "Casablanca",
      },
      locale: "de",
    });
    expect(result.success).toBe(false);
  });

  it("returns cart_empty when items is an empty array", () => {
    const result = checkoutSchema.safeParse({
      items: [],
      shipping: {
        name: "Jane Doe",
        phone: "0600000000",
        address: "1 rue Test",
        city: "Casablanca",
      },
      locale: "fr",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("cart_empty");
    }
  });
});
