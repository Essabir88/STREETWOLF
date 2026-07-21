import Link from "next/link";
import Image from "next/image";
import { getActiveProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { SITE_DESCRIPTION } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const allProducts = await getActiveProducts();
  const featured = allProducts.slice(0, 3);

  return (
    <>
      <section className="relative flex min-h-[86vh] items-end overflow-hidden border-b border-line">
        <Image
          src="/products/circle-logo-3.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/70 to-canvas/20" />
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-40">
          <div className="claw-divider mb-6" />
          <h1 className="font-display text-6xl uppercase leading-[0.9] tracking-wide text-ink sm:text-8xl">
            Street Wolf
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-muted">{SITE_DESCRIPTION}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/shop"
              className="rounded-md bg-accent px-7 py-3 font-display uppercase tracking-widest text-ink transition hover:opacity-90"
            >
              تسوّق الآن
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="claw-divider mb-4" />
            <h2 className="font-display text-3xl uppercase tracking-wide text-ink">
              أحدث الإصدارات
            </h2>
          </div>
          <Link href="/shop" className="text-sm text-ink-muted transition hover:text-ink">
            شاهد كل المجموعة ←
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="text-ink-muted">
            لا توجد منتجات بعد. شغّل <code className="font-mono text-ink">npm run db:seed</code> لإضافة أمثلة.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-line bg-surface-1">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-line">
            <Image
              src="/brand/collection-sheet-1.jpg"
              alt="مجموعة تصاميم Street Wolf"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="claw-divider mb-4" />
            <h2 className="font-display text-3xl uppercase tracking-wide text-ink">
              كل قطعة، إصدار محدود
            </h2>
            <ul className="mt-6 space-y-5 text-ink-muted">
              <li>
                <span className="font-display text-base text-ink">قصة خاصة — </span>
                كل تصميم له خلفية وسبب وجود، مكتوبة كاملة في صفحة المنتج.
              </li>
              <li>
                <span className="font-display text-base text-ink">عدد محدود — </span>
                كل إصدار مرقّم بعدد نسخ ثابت. حين ينفد، ينفد نهائياً.
              </li>
              <li>
                <span className="font-display text-base text-ink">نقاط تتراكم — </span>
                كل عملية شراء تضيف نقاطاً لحسابك، تُستبدل بخصم على الطلبات القادمة.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
