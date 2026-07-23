import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { isAdmin, adminPasswordConfigured } from "@/lib/adminAuth";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { AdminOrderRow } from "@/components/AdminOrderRow";
import { formatPrice } from "@/lib/points";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin — Street Wolf" };

export default async function AdminPage() {
  if (!adminPasswordConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20">
        <h1 className="font-display text-3xl font-700 uppercase text-ink">
          Espace admin désactivé
        </h1>
        <p className="mt-3 text-ink-muted">
          Définissez la variable d’environnement{" "}
          <code className="font-mono text-ink">ADMIN_PASSWORD</code> (dans .env
          en local, dans les variables Netlify en production) puis redéployez.
        </p>
      </div>
    );
  }

  if (!(await isAdmin())) redirect("/admin/login");

  const allOrders = await db.query.orders.findMany({
    orderBy: desc(orders.createdAt),
    with: { items: true },
    limit: 100,
  });

  const stock = await db
    .select({
      name: products.name,
      slug: products.slug,
      stockRemaining: products.stockRemaining,
      totalStock: products.totalStock,
    })
    .from(products)
    .where(eq(products.active, true));

  const [{ revenue }] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${orders.totalCents}), 0)`.mapWith(Number),
    })
    .from(orders)
    .where(sql`${orders.status} != 'cancelled'`);

  const pendingCount = allOrders.filter((o) => o.status === "pending").length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <div className="claw-divider mb-4" />
      <h1 className="font-display text-4xl font-700 uppercase tracking-[0.04em] text-ink">
        Commandes
      </h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="edition-plate p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
            Chiffre d’affaires
          </p>
          <p className="mt-1 font-mono text-2xl text-ink">{formatPrice(revenue)}</p>
        </div>
        <div className="edition-plate p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
            En attente
          </p>
          <p className="mt-1 font-mono text-2xl text-ink">{pendingCount}</p>
        </div>
        <div className="edition-plate p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
            Stock restant
          </p>
          <div className="mt-1 space-y-0.5 text-sm">
            {stock.map((s) => (
              <p key={s.slug} className="text-ink-muted">
                {s.name} :{" "}
                <span className="font-mono text-ink">
                  {s.stockRemaining}/{s.totalStock}
                </span>
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-4">
        {allOrders.length === 0 ? (
          <p className="text-ink-muted">Aucune commande pour l’instant.</p>
        ) : (
          allOrders.map((o) => (
            <AdminOrderRow
              key={o.id}
              order={{
                id: o.id,
                status: o.status,
                totalCents: o.totalCents,
                pointsRedeemed: o.pointsRedeemed,
                createdAt: o.createdAt.toISOString(),
                shippingName: o.shippingName,
                shippingPhone: o.shippingPhone,
                shippingAddress: o.shippingAddress,
                shippingCity: o.shippingCity,
                items: o.items,
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
