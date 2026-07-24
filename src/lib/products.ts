import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products, type LocalizedText } from "@/db/schema";
import type { Locale } from "@/i18n/routing";

export type ProductRow = typeof products.$inferSelect;

export type LocalizedProduct = Omit<ProductRow, "name" | "tagline" | "story"> & {
  name: string;
  tagline: string;
  story: string;
};

export function resolveLocalized(
  value: LocalizedText,
  locale: Locale,
  fallback: Locale = "fr"
): string {
  return value[locale]?.trim() || value[fallback]?.trim() || "";
}

export function localizeProduct(row: ProductRow, locale: Locale): LocalizedProduct {
  return {
    ...row,
    name: resolveLocalized(row.name, locale),
    tagline: resolveLocalized(row.tagline, locale),
    story: resolveLocalized(row.story, locale),
  };
}

export async function getActiveProducts(locale: Locale): Promise<LocalizedProduct[]> {
  const rows = await db.query.products.findMany({
    where: eq(products.active, true),
    orderBy: (p, { desc }) => desc(p.createdAt),
  });
  return rows.map((row) => localizeProduct(row, locale));
}

export async function getProductBySlug(
  slug: string,
  locale: Locale
): Promise<LocalizedProduct | null> {
  const row = await db.query.products.findFirst({
    where: eq(products.slug, slug),
  });
  return row ? localizeProduct(row, locale) : null;
}

/** Slugs of all active products, locale-independent — used by the sitemap. */
export async function getActiveProductSlugs(): Promise<string[]> {
  const rows = await db.query.products.findMany({
    where: eq(products.active, true),
    columns: { slug: true },
  });
  return rows.map((r) => r.slug);
}
