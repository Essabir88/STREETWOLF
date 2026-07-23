"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { QuantityStepper } from "./QuantityStepper";
import { formatPrice } from "@/lib/points";

export function AddToCartForm({
  productId,
  slug,
  name,
  priceCents,
  image,
  sizes,
  stockRemaining,
}: {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  image: string;
  sizes: string[];
  stockRemaining: number;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const soldOut = stockRemaining <= 0;

  const handleAdd = () => {
    if (soldOut) return;
    addItem(
      { productId, slug, name, priceCents, image, size, stockRemaining },
      quantity
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  if (soldOut) {
    return (
      <div className="edition-plate px-4 py-3 text-sm text-ink-muted">
        Cette édition est entièrement épuisée. Suivez-nous pour le prochain drop.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {sizes.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
            Taille
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`flex h-10 min-w-10 items-center justify-center border px-3 font-mono text-sm transition ${
                  size === s
                    ? "border-silver bg-surface-2 text-ink"
                    : "border-line text-ink-muted hover:border-ink-faint hover:text-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
          Quantité
        </p>
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          max={Math.min(10, stockRemaining)}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 bg-accent px-6 py-3.5 text-center font-display text-lg font-700 uppercase tracking-[0.14em] text-ink transition hover:opacity-90"
        >
          Ajouter au panier — {formatPrice(priceCents * quantity)}
        </button>
        {justAdded && (
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="border border-line px-4 py-3.5 text-sm text-ink transition hover:border-silver"
          >
            Ajouté ✓ — Voir le panier
          </button>
        )}
      </div>
    </div>
  );
}
