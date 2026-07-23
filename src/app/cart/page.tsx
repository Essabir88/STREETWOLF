"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/CartContext";
import { QuantityStepper } from "@/components/QuantityStepper";
import { formatPrice } from "@/lib/points";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalCents } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="font-display text-4xl font-700 uppercase tracking-[0.04em] text-ink">
          Panier vide
        </h1>
        <p className="mt-3 text-ink-muted">Vous n’avez encore rien ajouté.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block bg-accent px-6 py-3 font-display text-lg font-700 uppercase tracking-[0.14em] text-ink transition hover:opacity-90"
        >
          Voir la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="font-display text-4xl font-700 uppercase tracking-[0.04em] text-ink">
        Panier
      </h1>

      <div className="mt-8 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <div key={`${item.productId}-${item.size}`} className="flex gap-4 py-5">
            <div className="edition-plate relative h-24 w-20 shrink-0 overflow-hidden bg-surface-2">
              {item.image && (
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-700 uppercase tracking-[0.04em] text-ink">
                    {item.name}
                  </p>
                  {item.size && (
                    <p className="text-sm text-ink-faint">Taille : {item.size}</p>
                  )}
                </div>
                <p className="font-mono text-ink">
                  {formatPrice(item.priceCents * item.quantity)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <QuantityStepper
                  value={item.quantity}
                  onChange={(q) => updateQuantity(item.productId, item.size, q)}
                  max={item.stockRemaining}
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.productId, item.size)}
                  className="text-sm text-ink-faint transition hover:text-accent"
                >
                  Retirer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-ink-muted">Total</p>
        <p className="font-mono text-2xl text-ink">{formatPrice(totalCents)}</p>
      </div>

      <Link
        href="/checkout"
        className="mt-6 block bg-accent px-6 py-4 text-center font-display text-lg font-700 uppercase tracking-[0.14em] text-ink transition hover:opacity-90"
      >
        Passer commande
      </Link>
    </div>
  );
}
