import { getTranslations, setRequestLocale } from "next-intl/server";
import { getActiveProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import type { Locale } from "@/i18n/routing";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("shopTitle") };
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("shop");
  const products = await getActiveProducts(locale);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <div className="mb-10">
        <div className="claw-divider mb-4" />
        <h1 className="font-display text-5xl font-700 uppercase tracking-[0.04em] text-ink">
          {t("title")}
        </h1>
        <p className="mt-2 text-ink-muted">{t("subtitle")}</p>
      </div>

      {products.length === 0 ? (
        <p className="text-ink-muted">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
