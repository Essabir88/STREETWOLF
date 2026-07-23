import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { orders as ordersTable } from "@/db/schema";
import { formatPrice } from "@/lib/points";
import { buildOrderWhatsAppLink } from "@/lib/whatsapp";

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

  const waLink = buildOrderWhatsAppLink({
    orderId: record.id,
    items: record.items,
    totalCents: record.totalCents,
    discountCents: record.discountCents,
    shippingName: record.shippingName,
    shippingPhone: record.shippingPhone,
    shippingAddress: record.shippingAddress,
    shippingCity: record.shippingCity,
  });

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <div className="claw-divider mb-4" />
      <h1 className="font-display text-4xl font-700 uppercase tracking-[0.04em] text-ink">
        Commande reçue
      </h1>
      <p className="mt-2 text-ink-muted">
        N° de commande :{" "}
        <span className="font-mono text-ink">{record.id.slice(0, 8)}</span>
      </p>

      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center justify-center gap-2 bg-[#25D366] px-6 py-4 text-center font-display text-lg font-700 uppercase tracking-[0.14em] text-canvas transition hover:opacity-90"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.4 14.1c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1a13 13 0 0 1-1.5-.5c-2.6-1.1-4.3-3.7-4.4-3.9-.1-.2-1.1-1.4-1.1-2.7 0-1.3.7-1.9.9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.8.8 1.9.1.1.1.3 0 .4-.1.2-.1.3-.3.5l-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1.9 2 1.2 2.3 1.4.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.1.1.6-.2 1Z" />
          </svg>
          Confirmer sur WhatsApp
        </a>
      )}

      <div className="mt-8 divide-y divide-line border-y border-line">
        {record.items.map((item) => (
          <div key={item.id} className="flex justify-between py-4">
            <div>
              <p className="text-ink">{item.productName}</p>
              {item.size && (
                <p className="text-sm text-ink-faint">
                  Taille {item.size} × {item.quantity}
                </p>
              )}
            </div>
            <p className="font-mono text-ink">
              {formatPrice(item.priceCents * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between text-ink-muted">
          <span>Sous-total</span>
          <span className="font-mono">{formatPrice(record.subtotalCents)}</span>
        </div>
        {record.discountCents > 0 && (
          <div className="flex justify-between text-accent">
            <span>Réduction points</span>
            <span className="font-mono">−{formatPrice(record.discountCents)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg text-ink">
          <span>Total (à payer à la livraison)</span>
          <span className="font-mono">{formatPrice(record.totalCents)}</span>
        </div>
      </div>

      <div className="edition-plate mt-8 border-accent/40 bg-accent-soft p-4 text-sm text-ink">
        Vous avez gagné{" "}
        <span className="font-mono">{record.pointsAwarded}</span> points avec
        cette commande.
      </div>

      <div className="edition-plate mt-8 p-4 text-sm text-ink-muted">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
          Adresse de livraison
        </p>
        <p className="mt-2">
          {record.shippingName} — {record.shippingPhone}
        </p>
        <p>
          {record.shippingAddress}, {record.shippingCity}
        </p>
      </div>
    </div>
  );
}
