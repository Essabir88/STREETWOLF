import { getActiveProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export const metadata = { title: "المتجر — Street Wolf" };

export default async function ShopPage() {
  const products = await getActiveProducts();

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <div className="mb-10">
        <div className="claw-divider mb-4" />
        <h1 className="font-display text-4xl uppercase tracking-wide text-ink">المتجر</h1>
        <p className="mt-2 text-ink-muted">
          كل القطع المتوفرة حالياً. إصدارات محدودة — حين تنفد، لا تعود.
        </p>
      </div>

      {products.length === 0 ? (
        <p className="text-ink-muted">لا توجد منتجات متاحة حالياً.</p>
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
