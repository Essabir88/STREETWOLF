import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users, orders, pointsTransactions } from "@/db/schema";
import { formatPrice, pointsToDiscountCents, REDEEM_STEP } from "@/lib/points";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  if (status === "pending") return "En traitement";
  if (status === "confirmed") return "Confirmée";
  if (status === "fulfilled") return "Livrée";
  if (status === "cancelled") return "Annulée";
  return status;
}

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user) redirect("/login?next=/account");

  const myOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.userId))
    .orderBy(desc(orders.createdAt));

  const ledger = await db
    .select()
    .from(pointsTransactions)
    .where(eq(pointsTransactions.userId, session.userId))
    .orderBy(desc(pointsTransactions.createdAt));

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <div className="claw-divider mb-4" />
      <h1 className="font-display text-4xl font-700 uppercase tracking-[0.04em] text-ink">
        Mon compte
      </h1>
      <p className="mt-1 text-ink-muted">{user.email}</p>

      <div className="edition-plate mt-8 border-accent/40 bg-accent-soft p-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
          Solde de points
        </p>
        <p className="mt-1 font-mono text-4xl text-ink">{user.points}</p>
        <p className="mt-2 text-sm text-ink-muted">
          Chaque tranche de {REDEEM_STEP} points ={" "}
          {formatPrice(pointsToDiscountCents(REDEEM_STEP))} de réduction au
          paiement.
        </p>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-700 uppercase tracking-[0.04em] text-ink">
          Mes commandes
        </h2>
        {myOrders.length === 0 ? (
          <p className="mt-3 text-ink-muted">Aucune commande pour l’instant.</p>
        ) : (
          <div className="mt-4 divide-y divide-line border-y border-line">
            {myOrders.map((o) => (
              <Link
                key={o.id}
                href={`/order/${o.id}`}
                className="flex items-center justify-between py-4 transition hover:opacity-80"
              >
                <div>
                  <p className="font-mono text-ink">#{o.id.slice(0, 8)}</p>
                  <p className="text-sm text-ink-faint">
                    {new Date(o.createdAt).toLocaleDateString("fr-MA")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-ink">{formatPrice(o.totalCents)}</p>
                  <p className="text-sm text-ink-faint">{statusLabel(o.status)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mb-16 mt-12">
        <h2 className="font-display text-2xl font-700 uppercase tracking-[0.04em] text-ink">
          Historique des points
        </h2>
        {ledger.length === 0 ? (
          <p className="mt-3 text-ink-muted">Aucun mouvement pour l’instant.</p>
        ) : (
          <div className="mt-4 divide-y divide-line border-y border-line">
            {ledger.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="text-ink-muted">{t.reason}</span>
                <span
                  className={`font-mono ${t.amount >= 0 ? "text-silver" : "text-accent"}`}
                >
                  {t.amount >= 0 ? "+" : ""}
                  {t.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
