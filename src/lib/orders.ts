import { randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  products,
  orders,
  orderItems,
  pointsTransactions,
  users,
} from "@/db/schema";
import { pointsForTotal, pointsToDiscountCents, REDEEM_STEP } from "@/lib/points";

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

export class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutError";
  }
}

/**
 * Places an order inside a single database transaction: re-checks stock
 * against the database (never trusts client-sent prices or availability),
 * decrements stock, redeems/awards loyalty points, and writes an auditable
 * points-ledger entry. Throws CheckoutError with a user-facing message on
 * any failure, which rolls back the whole transaction automatically.
 *
 * Postgres transactions here are async (unlike the previous SQLite version
 * of this file) — every statement inside is awaited.
 */
export async function placeOrder(
  userId: string,
  items: CheckoutItemInput[],
  shipping: ShippingInput,
  pointsToRedeem: number
) {
  return db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new CheckoutError("المستخدم غير موجود.");

    if (pointsToRedeem % REDEEM_STEP !== 0) {
      throw new CheckoutError(`النقاط تُستبدل بمضاعفات ${REDEEM_STEP} فقط.`);
    }
    if (pointsToRedeem > user.points) {
      throw new CheckoutError("رصيد النقاط غير كافٍ لهذا الاستبدال.");
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
        throw new CheckoutError("أحد المنتجات في السلة لم يعد متوفراً.");
      }
      if (product.stockRemaining < item.quantity) {
        throw new CheckoutError(
          `الكمية المطلوبة من "${product.name}" غير متوفرة — تبقّى ${product.stockRemaining} فقط.`
        );
      }

      subtotalCents += product.priceCents * item.quantity;
      preparedItems.push({
        productId: product.id,
        productName: product.name,
        size: item.size ?? null,
        quantity: item.quantity,
        priceCents: product.priceCents,
      });
    }

    if (preparedItems.length === 0) {
      throw new CheckoutError("السلة فارغة.");
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

      await tx
        .update(products)
        .set({
          stockRemaining: sql`${products.stockRemaining} - ${item.quantity}`,
        })
        .where(eq(products.id, item.productId));
    }

    if (pointsToRedeem > 0) {
      await tx.insert(pointsTransactions).values({
        id: randomUUID(),
        userId,
        amount: -pointsToRedeem,
        reason: "استبدال نقاط عند الشراء",
        orderId,
      });
    }

    await tx.insert(pointsTransactions).values({
      id: randomUUID(),
      userId,
      amount: pointsAwarded,
      reason: "نقاط عن طلب جديد",
      orderId,
    });

    await tx
      .update(users)
      .set({ points: sql`${users.points} + ${pointsAwarded - pointsToRedeem}` })
      .where(eq(users.id, userId));

    return { orderId, subtotalCents, discountCents, totalCents, pointsAwarded };
  });
}
