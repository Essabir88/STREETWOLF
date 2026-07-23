"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { formatPrice, pointsToDiscountCents, REDEEM_STEP } from "@/lib/points";
import { PAYMENT_METHODS } from "@/lib/payments";
import { buildOrderWhatsAppLink } from "@/lib/whatsapp";

export function CheckoutForm({
  userPoints,
  defaultName,
  defaultPhone,
}: {
  userPoints: number;
  defaultName: string;
  defaultPhone: string;
}) {
  const router = useRouter();
  const { items, totalCents, clearCart } = useCart();

  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [redeemSteps, setRedeemSteps] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxRedeemSteps = Math.floor(userPoints / REDEEM_STEP);
  const pointsToRedeem = redeemSteps * REDEEM_STEP;
  const discountCents = Math.min(pointsToDiscountCents(pointsToRedeem), totalCents);
  const finalTotal = Math.max(0, totalCents - discountCents);

  if (items.length === 0) {
    return (
      <p className="mt-8 text-ink-muted">
        Votre panier est vide.{" "}
        <a href="/shop" className="text-ink underline">
          Voir la boutique
        </a>
      </p>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            quantity: i.quantity,
          })),
          shipping: { name, phone, address, city },
          pointsToRedeem,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Commande impossible");

      // Straight to WhatsApp with the full order summary prefilled, so the
      // customer confirms in one conversation. The order is already saved in
      // the database at this point — WhatsApp is the confirmation channel,
      // not the source of truth. Falls back to the order page when no
      // WhatsApp number is configured.
      const waLink = buildOrderWhatsAppLink({
        orderId: data.orderId,
        items: items.map((i) => ({
          productName: i.name,
          size: i.size,
          quantity: i.quantity,
          priceCents: i.priceCents,
        })),
        totalCents: data.totalCents,
        discountCents: data.discountCents,
        shippingName: name,
        shippingPhone: phone,
        shippingAddress: address,
        shippingCity: city,
      });

      clearCart();
      if (waLink) {
        window.location.assign(waLink);
      } else {
        router.push(`/order/${data.orderId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-8">
      <div className="space-y-4">
        <h2 className="font-display text-xl font-700 uppercase tracking-[0.04em] text-ink">
          Livraison
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="Nom complet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-silver sm:col-span-2"
          />
          <input
            required
            placeholder="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-silver"
          />
          <input
            required
            placeholder="Ville"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-silver"
          />
          <textarea
            required
            placeholder="Adresse complète"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-silver sm:col-span-2"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-xl font-700 uppercase tracking-[0.04em] text-ink">
          Paiement
        </h2>
        {PAYMENT_METHODS.map((method) => (
          <label
            key={method.id}
            className={`edition-plate flex items-start gap-3 p-4 ${
              method.available ? "border-accent/40 bg-accent-soft" : "opacity-50"
            }`}
          >
            <input
              type="radio"
              name="payment"
              defaultChecked={method.available}
              disabled={!method.available}
              className="mt-1"
            />
            <span>
              <span className="block text-ink">
                {method.label}
                {!method.available && " (bientôt)"}
              </span>
              <span className="block text-sm text-ink-muted">
                {method.description}
              </span>
            </span>
          </label>
        ))}
      </div>

      {userPoints > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-xl font-700 uppercase tracking-[0.04em] text-ink">
            Utiliser mes points
          </h2>
          <p className="text-sm text-ink-muted">
            Votre solde : <span className="font-mono text-ink">{userPoints}</span>{" "}
            points
          </p>
          {maxRedeemSteps > 0 ? (
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={maxRedeemSteps}
                value={redeemSteps}
                onChange={(e) => setRedeemSteps(Number(e.target.value))}
                className="flex-1 accent-[#c81e3a]"
              />
              <span className="w-44 shrink-0 font-mono text-sm text-ink">
                {pointsToRedeem} pts = −{formatPrice(discountCents)}
              </span>
            </div>
          ) : (
            <p className="text-sm text-ink-faint">
              Il faut au moins {REDEEM_STEP} points pour échanger.
            </p>
          )}
        </div>
      )}

      <div className="space-y-2 border-t border-line pt-6">
        <div className="flex justify-between text-ink-muted">
          <span>Sous-total</span>
          <span className="font-mono">{formatPrice(totalCents)}</span>
        </div>
        {discountCents > 0 && (
          <div className="flex justify-between text-accent">
            <span>Réduction points</span>
            <span className="font-mono">−{formatPrice(discountCents)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg text-ink">
          <span>Total (à payer à la livraison)</span>
          <span className="font-mono">{formatPrice(finalTotal)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-accent px-6 py-4 font-display text-lg font-700 uppercase tracking-[0.14em] text-ink transition hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Confirmation..." : "Confirmer la commande"}
      </button>
      <p className="text-center text-sm text-ink-faint">
        Après confirmation, vous serez redirigé vers WhatsApp avec le détail de
        votre commande pour la valider avec nous.
      </p>
    </form>
  );
}
