import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validation";
import { placeOrder, CheckoutError } from "@/lib/orders";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولاً." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  try {
    const result = await placeOrder(
      session.userId,
      parsed.data.items,
      parsed.data.shipping,
      parsed.data.pointsToRedeem
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json(
      { error: "تعذر إتمام الطلب. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
