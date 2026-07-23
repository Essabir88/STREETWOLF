import { NextResponse } from "next/server";
import {
  adminPasswordConfigured,
  checkAdminPassword,
  createAdminToken,
  adminCookieOptions,
} from "@/lib/adminAuth";

export async function POST(request: Request) {
  if (!adminPasswordConfigured()) {
    return NextResponse.json(
      { error: "Espace admin désactivé : ADMIN_PASSWORD n'est pas configuré." },
      { status: 503 }
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
