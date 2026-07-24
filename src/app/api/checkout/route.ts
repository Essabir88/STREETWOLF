import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validation";
import { placeOrder, CheckoutError } from "@/lib/orders";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { db } from "@/db";
import { products } from "@/db/schema";
import { routing } from "@/i18n/routing";

export async function POST(request: Request) {
  const { allowed, retryAfterMs } = checkRateLimit(
    `checkout:${clientIp(request)}`,
    30,
    60 * 60 * 1000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid_input" },
      { status: 400 }
    );
  }

  try {
    const result = await placeOrder(
      session.userId,
      parsed.data.items,
      parsed.data.shipping,
      parsed.data.pointsToRedeem,
      parsed.data.locale
    );

    // The catalog pages are ISR-cached (revalidate = 3600 in [locale]/page.tsx
    // and shop/page.tsx) so a purchase that empties a product's stock
    // wouldn't be reflected there for up to an hour without this — refresh
    // the pages that show stock, for every locale.
    const purchasedProductIds = [...new Set(parsed.data.items.map((i) => i.productId))];
    const purchasedProducts = purchasedProductIds.length
      ? await db
          .select({ slug: products.slug })
          .from(products)
          .where(inArray(products.id, purchasedProductIds))
      : [];
    for (const locale of routing.locales) {
      revalidatePath(`/${locale}`);
      revalidatePath(`/${locale}/shop`);
      for (const { slug } of purchasedProducts) {
        revalidatePath(`/${locale}/product/${slug}`);
      }
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.code, params: err.params }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
