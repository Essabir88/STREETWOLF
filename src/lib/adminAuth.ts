import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

// Admin access is a single shared password set via the ADMIN_PASSWORD env
// var — deliberately simple for a one-person store. If ADMIN_PASSWORD is not
// set, the whole /admin area is disabled (never open by default).
const ADMIN_COOKIE = "sw_admin";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export function adminPasswordConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function checkAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Constant-time-ish comparison; for a single low-value shared secret this
  // is acceptable. Rotate by changing the env var.
  if (password.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= password.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function createAdminToken() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecret());
}

export function adminCookieOptions(token: string) {
  return {
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}

export async function isAdmin() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}
