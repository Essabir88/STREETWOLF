import { randomUUID } from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  products,
  orders,
  orderItems,
  pointsTransactions,
  users,
} from "@/db/schema";
import { pointsForTotal, pointsToDiscountCents, REDEEM_STEP } from "@/lib/points";
import { resolveLocalized } from "@/lib/products";
import type { Locale } from "@/i18n/routing";

export type CheckoutItemInput = {
  productId: string;
  size?: string | null;
  quantity: number;
};

export type ShippingInput = {
  name: string;
  phone: string;
  address: string;
  city: string;
};

// Stable, presentation-independent codes — never translated text. The
// caller (a Route Handler) maps these to localized copy via next-intl, and
// tests can assert on the code without depending on any particular locale.
export type CheckoutErrorCode =
  | "user_not_found"
  | "invalid_redeem_step"
  | "insufficient_points"
  | "product_unavailable"
  | "insufficient_stock"
  | "cart_empty";

export class CheckoutError extends Error {
  code: CheckoutErrorCode;
  params?: Record<string, string | number>;

  constructor(code: CheckoutErrorCode, params?: Record<string, string | number>) {
    super(code);
    this.name = "CheckoutError";
    this.code = code;
    this.params = params;
  }
}

/**
 * Places an order inside a single database transaction: re-checks stock
 * against the database (never trusts client-sent prices or availability),
 * decrements stock, redeems/awards loyalty points, and writes an auditable
 * points-ledger entry. Throws CheckoutError on any failure, which rolls back
 * the whole transaction automatically.
 *
 * `locale` only affects the human-readable productName snapshot stored on
 * each order item — like a paper receipt, it's fixed at purchase time and
 * doesn't change if the buyer later switches the site's language.
 */
export async function placeOrder(
  userId: string,
  items: CheckoutItemInput[],
  shipping: ShippingInput,
  pointsToRedeem: number,
  locale: Locale
) {
  return db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new CheckoutError("user_not_found");

    if (pointsToRedeem % REDEEM_STEP !== 0) {
      throw new CheckoutError("invalid_redeem_step", { step: REDEEM_STEP });
    }
    if (pointsToRedeem > user.points) {
      throw new CheckoutError("insufficient_points");
    }

    let subtotalCents = 0;
    const preparedItems: {
      productId: string;
      productName: string;
      size: string | null;
      quantity: number;
      priceCents: number;
    }[] = [];

    for (const item of items) {
      if (item.quantity < 1) continue;
      const [product] = await tx
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product || !product.active) {
        throw new CheckoutError("product_unavailable");
      }
      if (product.stockRemaining < item.quantity) {
        throw new CheckoutError("insufficient_stock", {
          productId: product.id,
          remaining: product.stockRemaining,
        });
      }

      subtotalCents += product.priceCents * item.quantity;
      preparedItems.push({
        productId: product.id,
        productName: resolveLocalized(product.name, locale),
        size: item.size ?? null,
        quantity: item.quantity,
        priceCents: product.priceCents,
      });
    }

    if (preparedItems.length === 0) {
      throw new CheckoutError("cart_empty");
    }

    const discountCents = Math.min(
      pointsToDiscountCents(pointsToRedeem),
      subtotalCents
    );
    const totalCents = subtotalCents - discountCents;
    // Points are earned on what was actually paid, after any discount, so
    // redeeming and immediately re-earning the same points isn't possible.
    const pointsAwarded = pointsForTotal(totalCents);
    const orderId = randomUUID();

    await tx.insert(orders).values({
      id: orderId,
      userId,
      status: "pending",
      paymentMethod: "cod",
      subtotalCents,
      pointsRedeemed: pointsToRedeem,
      discountCents,
      totalCents,
      pointsAwarded,
      shippingName: shipping.name,
      shippingPhone: shipping.phone,
      shippingAddress: shipping.address,
      shippingCity: shipping.city,
    });

    for (const item of preparedItems) {
      await tx.insert(orderItems).values({
        id: randomUUID(),
        orderId,
        productId: item.productId,
        productName: item.productName,
        size: item.size,
        quantity: item.quantity,
        priceCents: item.priceCents,
      });

      // Atomic conditional decrement: the WHERE clause is checked by the
      // same UPDATE that writes the new value, so under Postgres's default
      // READ COMMITTED isolation the row gets locked on the first writer and
      // a concurrent checkout for the same product re-reads the already
      // decremented value and correctly fails here — instead of two
      // concurrent transactions both reading "enough stock" before either
      // writes, which could take stockRemaining negative.
      const [updated] = await tx
        .update(products)
        .set({
          stockRemaining: sql`${products.stockRemaining} - ${item.quantity}`,
        })
        .where(
          and(
            eq(products.id, item.productId),
            sql`${products.stockRemaining} >= ${item.quantity}`
          )
        )
        .returning({ id: products.id });

      if (!updated) {
        throw new CheckoutError("insufficient_stock", {
          productId: item.productId,
          remaining: 0,
        });
      }
    }

    if (pointsToRedeem > 0) {
      await tx.insert(pointsTransactions).values({
        id: randomUUID(),
        userId,
        amount: -pointsToRedeem,
        reason: "redeemed_at_checkout",
        orderId,
      });
    }

    await tx.insert(pointsTransactions).values({
      id: randomUUID(),
      userId,
      amount: pointsAwarded,
      reason: "earned_on_order",
      orderId,
    });

    await tx
      .update(users)
      .set({ points: sql`${users.points} + ${pointsAwarded - pointsToRedeem}` })
      .where(eq(users.id, userId));

    return { orderId, subtotalCents, discountCents, totalCents, pointsAwarded };
  });
}
