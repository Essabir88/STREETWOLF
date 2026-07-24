import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { timingSafeEqual } from "crypto";

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

const PASSWORD_COMPARE_BUFFER_SIZE = 256;

export function checkAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Real constant-time comparison: pad both sides to a fixed size *before*
  // comparing, so timingSafeEqual (which throws on mismatched buffer
  // lengths) always receives equal-length buffers. This avoids leaking the
  // expected password's length through an early return, unlike a naive
  // `if (password.length !== expected.length) return false` guard.
  const a = Buffer.alloc(PASSWORD_COMPARE_BUFFER_SIZE);
  const b = Buffer.alloc(PASSWORD_COMPARE_BUFFER_SIZE);
  a.write(password.slice(0, PASSWORD_COMPARE_BUFFER_SIZE), "utf8");
  b.write(expected.slice(0, PASSWORD_COMPARE_BUFFER_SIZE), "utf8");
  const contentMatches = timingSafeEqual(a, b);
  return contentMatches && password.length === expected.length;
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
