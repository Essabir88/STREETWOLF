import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { loginSchema } from "@/lib/validation";
import {
  verifyPassword,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const { allowed, retryAfterMs } = checkRateLimit(
    `login:${clientIp(request)}`,
    20,
    10 * 60 * 1000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid_input" },
      { status: 400 }
    );
  }
  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  // Same generic code whether the email or the password was wrong, so a
  // caller can't use this endpoint to discover which emails are registered.
  const invalid = () =>
    NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

  if (!user) return invalid();
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return invalid();

  const token = await createSessionToken(user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieOptions(token));
  return res;
}
