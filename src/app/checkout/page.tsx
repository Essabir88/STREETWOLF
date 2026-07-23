import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { CheckoutForm } from "@/components/CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/checkout");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user) redirect("/login?next=/checkout");

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <div className="claw-divider mb-4" />
      <h1 className="font-display text-4xl font-700 uppercase tracking-[0.04em] text-ink">
        Finaliser ma commande
      </h1>
      <CheckoutForm
        userPoints={user.points}
        defaultName={user.name ?? ""}
        defaultPhone={user.phone ?? ""}
      />
    </div>
  );
}
