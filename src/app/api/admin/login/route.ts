import { NextResponse } from "next/server";
import {
  adminPasswordConfigured,
  checkAdminPassword,
  createAdminToken,
  adminCookieOptions,
} from "@/lib/adminAuth";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (!adminPasswordConfigured()) {
    return NextResponse.json(
      { error: "Espace admin désactivé : ADMIN_PASSWORD n'est pas configuré." },
      { status: 503 }
    );
  }

  // Tighter limit than customer-facing auth: this guards a single shared
  // password with access to every order and customer address.
  const { allowed, retryAfterMs } = checkRateLimit(
    `admin-login:${clientIp(request)}`,
    5,
    15 * 60 * 1000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!checkAdminPassword(password)) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }
  const token = await createAdminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(adminCookieOptions(token));
  return res;
}
