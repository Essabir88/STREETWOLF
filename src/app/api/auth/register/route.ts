import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { registerSchema } from "@/lib/validation";
import {
  hashPassword,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }
  const { name, email, phone, password } = parsed.data;

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return NextResponse.json(
      { error: "Cette adresse e-mail est déjà utilisée." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  await db
    .insert(users)
    .values({ id: userId, email, passwordHash, name, phone: phone || null });

  const token = await createSessionToken(userId);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieOptions(token));
  return res;
}
