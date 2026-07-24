import { eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { CheckoutForm } from "@/components/CheckoutForm";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) {
    redirect({ href: "/login?next=/checkout", locale });
    return;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user) {
    redirect({ href: "/login?next=/checkout", locale });
    return;
  }

  const t = await getTranslations("checkout");

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <div className="claw-divider mb-4" />
      <h1 className="font-display text-4xl font-700 uppercase tracking-[0.04em] text-ink">
        {t("pageTitle")}
      </h1>
      <CheckoutForm
        userPoints={user.points}
        defaultName={user.name ?? ""}
        defaultPhone={user.phone ?? ""}
      />
    </div>
  );
}
