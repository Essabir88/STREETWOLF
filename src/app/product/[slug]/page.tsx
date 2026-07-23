import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductBySlug } from "@/lib/products";
import { EditionBadge } from "@/components/EditionBadge";
import { AddToCartForm } from "@/components/AddToCartForm";
import { formatPrice } from "@/lib/points";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product ? `${product.name} — Street Wolf` : "Produit introuvable",
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const storyParagraphs = product.story.split(/\n\s*\n/).filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="edition-plate relative aspect-[4/5] overflow-hidden bg-surface-2">
            {product.images[0] && (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-3 gap-3">
              {product.images.slice(1).map((img) => (
                <div
                  key={img}
                  className="edition-plate relative aspect-square overflow-hidden bg-surface-2"
                >
                  <Image src={img} alt={product.name} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="claw-divider mb-4" />
          <h1 className="font-display text-6xl font-900 uppercase leading-[0.9] tracking-[0.02em] text-ink">
            {product.name}
          </h1>
          <p className="mt-3 text-ink-muted">{product.tagline}</p>
          <p className="mt-5 font-mono text-3xl text-ink">
            {formatPrice(product.priceCents)}
          </p>
          <div className="edition-plate mt-5 p-4">
            <EditionBadge
              totalStock={product.totalStock}
              stockRemaining={product.stockRemaining}
              size="lg"
            />
          </div>

          <div className="mt-8 border-t border-line pt-8">
            <AddToCartForm
              productId={product.id}
              slug={product.slug}
              name={product.name}
              priceCents={product.priceCents}
              image={product.images[0] ?? ""}
              sizes={product.sizes}
              stockRemaining={product.stockRemaining}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-2xl border-t border-line pt-12">
        <div className="claw-divider mb-4" />
        <h2 className="font-display text-3xl font-700 uppercase tracking-[0.04em] text-ink">
          L’histoire
        </h2>
        <div className="mt-4 space-y-4 leading-8 text-ink-muted">
          {storyParagraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
