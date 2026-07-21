import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { orders as ordersTable } from "@/db/schema";
import { formatPrice } from "@/lib/points";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=/order/${id}`);

  const record = await db.query.orders.findFirst({
    where: eq(ordersTable.id, id),
    with: { items: true },
  });

  if (!record || record.userId !== session.userId) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <div className="claw-divider mb-4" />
      <h1 className="font-display text-3xl uppercase tracking-wide text-ink">تم استلام طلبك</h1>
      <p className="mt-2 text-ink-muted">
        رقم الطلب: <span className="font-mono text-ink">{record.id.slice(0, 8)}</span>
      </p>

      <div className="mt-8 divide-y divide-line border-y border-line">
        {record.items.map((item) => (
          <div key={item.id} className="flex justify-between py-4">
            <div>
              <p className="text-ink">{item.productName}</p>
              {item.size && (
                <p className="text-sm text-ink-faint">
                  المقاس: {item.size} × {item.quantity}
                </p>
              )}
            </div>
            <p className="font-mono text-ink">{formatPrice(item.priceCents * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between text-ink-muted">
          <span>المجموع الفرعي</span>
          <span className="font-mono">{formatPrice(record.subtotalCents)}</span>
        </div>
        {record.discountCents > 0 && (
          <div className="flex justify-between text-accent">
            <span>خصم النقاط</span>
            <span className="font-mono">-{formatPrice(record.discountCents)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg text-ink">
          <span>الإجمالي (يُدفع عند الاستلام)</span>
          <span className="font-mono">{formatPrice(record.totalCents)}</span>
        </div>
      </div>

      <div className="mt-8 rounded-md border border-accent/40 bg-accent-soft p-4 text-sm text-ink">
        كسبت <span className="font-mono">{record.pointsAwarded}</span> نقطة من هذا الطلب.
      </div>

      <div className="mt-8 rounded-md border border-line p-4 text-sm text-ink-muted">
        <p className="text-ink">عنوان التوصيل</p>
        <p className="mt-1">
          {record.shippingName} — {record.shippingPhone}
        </p>
        <p>
          {record.shippingAddress}, {record.shippingCity}
        </p>
      </div>
    </div>
  );
}
