import { eq, desc } from "drizzle-orm";
import { getTranslations, getFormatter, setRequestLocale } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users, orders, pointsTransactions } from "@/db/schema";
import { formatPrice, pointsToDiscountCents, REDEEM_STEP } from "@/lib/points";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  // next-intl's redirect() is typed to return `never`, same as
  // next/navigation's, but its more complex generic signature isn't always
  // enough for TS to narrow `session` afterward — the explicit `return`
  // makes the control-flow analysis unambiguous regardless.
  if (!session) {
    redirect({ href: "/login?next=/account", locale });
    return;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user) {
    redirect({ href: "/login?next=/account", locale });
    return;
  }

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

  const t = await getTranslations("account");
  const format = await getFormatter();

  const statusLabel = (status: string) =>
    t.has(`status.${status}`) ? t(`status.${status}` as "status.pending") : status;
  const pointsReasonLabel = (reason: string) =>
    t.has(`pointsReason.${reason}`)
      ? t(`pointsReason.${reason}` as "pointsReason.earned_on_order")
      : reason;

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <div className="claw-divider mb-4" />
      <h1 className="font-display text-4xl font-700 uppercase tracking-[0.04em] text-ink">
        {t("title")}
      </h1>
      <p className="mt-1 text-ink-muted">{user.email}</p>

      <div className="edition-plate mt-8 border-accent/40 bg-accent-soft p-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
          {t("pointsBalance")}
        </p>
        <p className="mt-1 font-mono text-4xl text-ink">{user.points}</p>
        <p className="mt-2 text-sm text-ink-muted">
          {t("pointsRule", {
            step: REDEEM_STEP,
            amount: formatPrice(pointsToDiscountCents(REDEEM_STEP), locale),
          })}
        </p>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-700 uppercase tracking-[0.04em] text-ink">
          {t("myOrders")}
        </h2>
        {myOrders.length === 0 ? (
          <p className="mt-3 text-ink-muted">{t("noOrders")}</p>
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
                    {format.dateTime(o.createdAt, { dateStyle: "medium" })}
                  </p>
                </div>
                <div className="text-end">
                  <p className="font-mono text-ink">
                    {formatPrice(o.totalCents, locale)}
                  </p>
                  <p className="text-sm text-ink-faint">{statusLabel(o.status)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mb-16 mt-12">
        <h2 className="font-display text-2xl font-700 uppercase tracking-[0.04em] text-ink">
          {t("pointsHistory")}
        </h2>
        {ledger.length === 0 ? (
          <p className="mt-3 text-ink-muted">{t("noPointsHistory")}</p>
        ) : (
          <div className="mt-4 divide-y divide-line border-y border-line">
            {ledger.map((tItem) => (
              <div
                key={tItem.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="text-ink-muted">
                  {pointsReasonLabel(tItem.reason)}
                </span>
                <span
                  className={`font-mono ${tItem.amount >= 0 ? "text-silver" : "text-accent"}`}
                >
                  {tItem.amount >= 0 ? "+" : ""}
                  {tItem.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
