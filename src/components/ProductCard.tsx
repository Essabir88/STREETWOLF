import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/points";
import { ProductWithImages } from "@/lib/products";
import { EditionBadge } from "./EditionBadge";

export function ProductCard({ product }: { product: ProductWithImages }) {
  const soldOut = product.stockRemaining <= 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-md border border-line bg-surface-1 transition hover:border-ink-faint"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className={`object-cover transition duration-500 ${
              soldOut ? "grayscale opacity-50" : "group-hover:scale-[1.03]"
            }`}
          />
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-canvas/40">
            <span className="rounded-sm border border-ink/60 px-3 py-1 font-display text-sm uppercase tracking-widest text-ink">
              نفدت الكمية
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl uppercase leading-none tracking-wide text-ink">
            {product.name}
          </h3>
          <span className="whitespace-nowrap font-mono text-base text-ink">
            {formatPrice(product.priceCents)}
          </span>
        </div>
        <p className="text-sm text-ink-muted">{product.tagline}</p>
        <EditionBadge
          totalStock={product.totalStock}
          stockRemaining={product.stockRemaining}
        />
      </div>
    </Link>
  );
}
