import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

// The whole "@/db" module is replaced with an in-memory Postgres (PGlite)
// instance running the real migrations, so lib/orders.ts is exercised
// against actual SQL (transactions, CHECK constraints, atomic UPDATE...WHERE)
// instead of a mock that could hide real bugs. One instance is shared across
// this file's tests (booting PGlite's WASM runtime per test would be slow);
// isolation between tests comes from unique ids and explicit cleanup below.
vi.mock("@/db", async () => {
  const { createTestDb } = await import("@/test/dbTestUtils");
  const { db } = await createTestDb();
  return { db };
});

const { db } = await import("@/db");
const { users, products, orders, orderItems, pointsTransactions } = await import(
  "@/db/schema"
);
const { placeOrder, CheckoutError } = await import("@/lib/orders");

async function insertUser(points = 0) {
  const id = randomUUID();
  await db.insert(users).values({
    id,
    email: `${id}@example.com`,
    passwordHash: "hash",
    points,
  });
  return id;
}

async function insertProduct(overrides: {
  stockRemaining: number;
  totalStock?: number;
  priceCents?: number;
  active?: boolean;
}) {
  const id = randomUUID();
  await db.insert(products).values({
    id,
    slug: `product-${id}`,
    name: { fr: "Produit", en: "Product", ar: "منتج" },
    tagline: { fr: "", en: "", ar: "" },
    story: { fr: "Histoire", en: "Story", ar: "قصة" },
    priceCents: overrides.priceCents ?? 10000,
    images: [],
    sizes: ["M"],
    totalStock: overrides.totalStock ?? overrides.stockRemaining,
    stockRemaining: overrides.stockRemaining,
    active: overrides.active ?? true,
  });
  return id;
}

const shipping = {
  name: "Jane Doe",
  phone: "0600000000",
  address: "1 rue Test",
  city: "Casablanca",
};

beforeAll(async () => {
  // Sanity check the mocked db is wired up before running the suite.
  expect(db).toBeDefined();
});

beforeEach(async () => {
  // Cheap full reset between tests (small in-memory DB, negligible cost).
  await db.delete(pointsTransactions);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(products);
  await db.delete(users);
});

describe("placeOrder", () => {
  it("recalculates price and stock from the database, ignoring anything the client could send", async () => {
    const userId = await insertUser();
    const productId = await insertProduct({ stockRemaining: 5, priceCents: 15000 });

    const result = await placeOrder(
      userId,
      [{ productId, size: "M", quantity: 2 }],
      shipping,
      0,
      "fr"
    );

    // 2 x 15000 = 30000, not whatever a tampered client might have sent.
    expect(result.subtotalCents).toBe(30000);
    expect(result.totalCents).toBe(30000);

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));
    expect(product.stockRemaining).toBe(3);
  });

  it("rejects with insufficient_stock when quantity exceeds stock", async () => {
    const userId = await insertUser();
    const productId = await insertProduct({ stockRemaining: 1 });

    await expect(
      placeOrder(userId, [{ productId, quantity: 2 }], shipping, 0, "fr")
    ).rejects.toMatchObject({ code: "insufficient_stock" });
  });

  it("rejects with product_unavailable for an inactive product", async () => {
    const userId = await insertUser();
    const productId = await insertProduct({ stockRemaining: 5, active: false });

    await expect(
      placeOrder(userId, [{ productId, quantity: 1 }], shipping, 0, "fr")
    ).rejects.toMatchObject({ code: "product_unavailable" });
  });

  it("rejects with insufficient_points when redeeming more than the balance", async () => {
    const userId = await insertUser(10);
    const productId = await insertProduct({ stockRemaining: 5 });

    await expect(
      placeOrder(userId, [{ productId, quantity: 1 }], shipping, 50, "fr")
    ).rejects.toBeInstanceOf(CheckoutError);
    await expect(
      placeOrder(userId, [{ productId, quantity: 1 }], shipping, 50, "fr")
    ).rejects.toMatchObject({ code: "insufficient_points" });
  });

  it("rejects with invalid_redeem_step when not a multiple of REDEEM_STEP", async () => {
    const userId = await insertUser(1000);
    const productId = await insertProduct({ stockRemaining: 5 });

    await expect(
      placeOrder(userId, [{ productId, quantity: 1 }], shipping, 30, "fr")
    ).rejects.toMatchObject({ code: "invalid_redeem_step" });
  });

  it("rejects with cart_empty when every line has quantity < 1", async () => {
    const userId = await insertUser();
    const productId = await insertProduct({ stockRemaining: 5 });

    await expect(
      placeOrder(userId, [{ productId, quantity: 0 }], shipping, 0, "fr")
    ).rejects.toMatchObject({ code: "cart_empty" });
  });

  it("awards points on the discounted total, redeems points, and writes a ledger entry", async () => {
    const userId = await insertUser(100);
    const productId = await insertProduct({ stockRemaining: 5, priceCents: 10000 });

    await placeOrder(userId, [{ productId, quantity: 1 }], shipping, 50, "fr");

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    // 100 - 50 redeemed + points earned on (10000 - discount) at 1pt/MAD.
    expect(user.points).toBeGreaterThan(0);

    const ledger = await db
      .select()
      .from(pointsTransactions)
      .where(eq(pointsTransactions.userId, userId));
    expect(ledger.some((l) => l.amount === -50)).toBe(true);
  });

  it("snapshots the order item's productName in the requested locale", async () => {
    const userId = await insertUser();
    const productId = await insertProduct({ stockRemaining: 5 });

    const result = await placeOrder(
      userId,
      [{ productId, quantity: 1 }],
      shipping,
      0,
      "en"
    );

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, result.orderId));
    expect(items[0].productName).toBe("Product");
  });

  it("never oversells under concurrent checkouts for the same product", async () => {
    const buyerA = await insertUser();
    const buyerB = await insertUser();
    const productId = await insertProduct({ stockRemaining: 1 });

    const [resultA, resultB] = await Promise.allSettled([
      placeOrder(buyerA, [{ productId, quantity: 1 }], shipping, 0, "fr"),
      placeOrder(buyerB, [{ productId, quantity: 1 }], shipping, 0, "fr"),
    ]);

    const outcomes = [resultA, resultB];
    const succeeded = outcomes.filter((o) => o.status === "fulfilled");
    const failed = outcomes.filter((o) => o.status === "rejected");

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect((failed[0] as PromiseRejectedResult).reason).toMatchObject({
      code: "insufficient_stock",
    });

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));
    expect(product.stockRemaining).toBe(0);
  });
});
