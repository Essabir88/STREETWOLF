import type { Metadata } from "next";
import { eq } from "drizzle-orm";
// Self-hosted fonts (no build-time fetch to Google's servers required —
// safer for CI/sandboxed environments with restricted network egress).
import "@fontsource/anton";
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/500.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/800.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/config";

export const metadata: Metadata = {
  title: `${SITE_NAME} — Street Wolf`,
  description: SITE_DESCRIPTION,
};

async function getHeaderData() {
  const session = await getSession();
  if (!session) return { isLoggedIn: false, points: null as number | null };
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    columns: { points: true },
  });
  if (!user) return { isLoggedIn: false, points: null as number | null };
  return { isLoggedIn: true, points: user.points };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isLoggedIn, points } = await getHeaderData();

  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className="flex min-h-full flex-col font-body antialiased">
        <CartProvider>
          <Header isLoggedIn={isLoggedIn} points={points} />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
