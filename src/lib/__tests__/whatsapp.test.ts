import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("buildOrderWhatsAppLink", () => {
  const original = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "212612345678";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = original;
  });

  it("returns null when no WhatsApp number is configured", async () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "";
    // whatsapp.ts reads the env var at module load time, so force a fresh
    // module instance (a distinct query string gives Vite a distinct
    // module graph entry) after changing it.
    const mod = await import(`@/lib/whatsapp?no-number=${Date.now()}`);
    expect(mod.buildOrderWhatsAppLink({
      orderId: "abc123",
      items: [],
      totalCents: 0,
      discountCents: 0,
      shippingName: "Jane",
      shippingPhone: "0600000000",
      shippingCity: "Casablanca",
    })).toBeNull();
  });

  it("includes the city but never the full street address (PII minimization)", async () => {
    const mod = await import(`@/lib/whatsapp?with-number=${Date.now()}`);
    const link = mod.buildOrderWhatsAppLink(
      {
        orderId: "abc12345",
        items: [{ productName: "Circle Logo", size: "M", quantity: 1, priceCents: 27900 }],
        totalCents: 27900,
        discountCents: 0,
        shippingName: "Jane Doe",
        shippingPhone: "0600000000",
        shippingCity: "Casablanca",
      },
      "fr"
    );
    expect(link).not.toBeNull();
    const decoded = decodeURIComponent(link!);
    expect(decoded).toContain("Casablanca");
    expect(decoded).not.toContain("rue"); // no street address was ever passed in
    expect(link).toContain("https://wa.me/212612345678");
  });

  it("localizes labels per locale", async () => {
    const mod = await import(`@/lib/whatsapp?locales=${Date.now()}`);
    const order = {
      orderId: "abc12345",
      items: [{ productName: "Circle Logo", size: null, quantity: 1, priceCents: 27900 }],
      totalCents: 27900,
      discountCents: 0,
      shippingName: "Jane Doe",
      shippingPhone: "0600000000",
      shippingCity: "Casablanca",
    };
    const fr = decodeURIComponent(mod.buildOrderWhatsAppLink(order, "fr")!);
    const en = decodeURIComponent(mod.buildOrderWhatsAppLink(order, "en")!);
    expect(fr).toContain("Total à la livraison");
    expect(en).toContain("Total due on delivery");
  });
});
