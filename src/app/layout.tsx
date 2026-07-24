import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
// Self-hosted fonts (no build-time fetch to Google's servers required).
import "@fontsource/big-shoulders-display/500";
import "@fontsource/big-shoulders-display/700";
import "@fontsource/big-shoulders-display/900";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
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
import { SITE_NAME } from "@/lib/config";
import { isRtl, type Locale } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const messages = (await getMessages()) as {
    metadata: { siteDescription: string };
  };
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    ),
    title: `${SITE_NAME} — Rule the Streets`,
    description: messages.metadata.siteDescription,
  };
}

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
  // Resolves to "fr" outside the [locale] segment (e.g. /admin), since the
  // proxy (src/proxy.ts) doesn't run there and next-intl falls back to the
  // default locale — which is what we want for the non-localized admin area.
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} className="h-full">
      <body className="flex min-h-full flex-col font-body antialiased">
        <NextIntlClientProvider messages={messages}>
          <CartProvider>
            <Header isLoggedIn={isLoggedIn} points={points} />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
