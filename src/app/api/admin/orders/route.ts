import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { isAdmin } from "@/lib/adminAuth";

const updateSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["pending", "confirmed", "fulfilled", "cancelled"]),
});

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  const { orderId, status } = parsed.data;
  const result = await db
    .update(orders)
    .set({ status })
    .where(eq(orders.id, orderId))
    .returning({ id: orders.id, status: orders.status });
  if (result.length === 0) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, order: result[0] });
}
