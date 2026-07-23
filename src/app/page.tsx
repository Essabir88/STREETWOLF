import Link from "next/link";
import Image from "next/image";
import { getActiveProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

const MARQUEE_ITEMS =
  "RULE THE STREETS — ÉDITIONS LIMITÉES — CASABLANCA — CHAQUE PIÈCE A SON HISTOIRE — ";

export default async function HomePage() {
  const allProducts = await getActiveProducts();
  const featured = allProducts.slice(0, 3);

  return (
    <>
      <section className="relative flex min-h-[88vh] items-end overflow-hidden border-b border-line">
        <Image
          src="/products/circle-logo-3.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/70 to-canvas/15" />
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-14 pt-40">
          <div className="claw-divider hero-rise mb-6" />
          <h1 className="hero-rise font-display text-[clamp(64px,14vw,168px)] font-900 uppercase leading-[0.85] tracking-[0.02em] text-ink">
            Street
            <br />
            Wolf
          </h1>
          <p className="hero-rise-late mt-5 max-w-xl text-lg text-ink-muted">
            Éditions limitées et numérotées. Chaque pièce a son histoire —
            quand c’est épuisé, ça ne revient pas.
          </p>
          <div className="hero-rise-late mt-8">
            <Link
              href="/shop"
              className="inline-block bg-accent px-8 py-3.5 font-display text-lg font-700 uppercase tracking-[0.14em] text-ink transition hover:opacity-90"
            >
              Voir les drops
            </Link>
          </div>
        </div>
      </section>

      <div className="marquee py-2.5" aria-hidden="true">
        <div className="marquee-track font-display text-sm font-500 uppercase tracking-[0.3em] text-ink-faint">
          {MARQUEE_ITEMS.repeat(3)}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="claw-divider mb-4" />
            <h2 className="font-display text-4xl font-700 uppercase tracking-[0.04em] text-ink">
              Les drops en cours
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-sm text-ink-muted transition hover:text-ink"
          >
            Toute la collection →
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="text-ink-muted">
            Aucun produit pour l’instant. Lancez{" "}
            <code className="font-mono text-ink">npm run db:seed</code> pour
            ajouter des exemples.
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
          <div className="edition-plate relative aspect-[4/3] overflow-hidden">
            <Image
              src="/brand/collection-sheet-1.jpg"
              alt="La collection Street Wolf"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="claw-divider mb-4" />
            <h2 className="font-display text-4xl font-700 uppercase tracking-[0.04em] text-ink">
              Chaque pièce, une édition limitée
            </h2>
            <ul className="mt-6 space-y-5 text-ink-muted">
              <li>
                <span className="font-display text-lg font-700 uppercase text-ink">
                  Une histoire —{" "}
                </span>
                chaque design a une raison d’exister, racontée en entier sur sa
                page.
              </li>
              <li>
                <span className="font-display text-lg font-700 uppercase text-ink">
                  Un tirage numéroté —{" "}
                </span>
                chaque drop a un nombre fixe d’exemplaires. Épuisé, c’est
                définitif.
              </li>
              <li>
                <span className="font-display text-lg font-700 uppercase text-ink">
                  Des points fidélité —{" "}
                </span>
                chaque achat crédite votre compte en points, échangeables en
                réduction sur vos prochaines commandes.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
