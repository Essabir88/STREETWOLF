"use client";

import { useState, type FormEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useCart } from "./CartContext";
import { formatPrice, pointsToDiscountCents, REDEEM_STEP } from "@/lib/points";
import { PAYMENT_METHODS } from "@/lib/payments";
import { buildOrderWhatsAppLink } from "@/lib/whatsapp";
import type { Locale } from "@/i18n/routing";

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
  const locale = useLocale() as Locale;
  const t = useTranslations("checkout");
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
        {t("empty")}{" "}
        <Link href="/shop" className="text-ink underline">
          {t("viewShop")}
        </Link>
      </p>
    );
  }

  const resolveError = (code: string | undefined) => {
    if (!code) return t("errors.generic");
    if (t.has(`errors.${code}` as "errors.generic")) {
      return t(`errors.${code}` as "errors.generic");
    }
    return t("errors.generic");
  };

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
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(resolveError(data.error));

      // Straight to WhatsApp with the full order summary prefilled, so the
      // customer confirms in one conversation. The order is already saved in
      // the database at this point — WhatsApp is the confirmation channel,
      // not the source of truth. Falls back to the order page when no
      // WhatsApp number is configured.
      const waLink = buildOrderWhatsAppLink(
        {
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
          shippingCity: city,
        },
        locale
      );

      clearCart();
      if (waLink) {
        window.location.assign(waLink);
      } else {
        router.push(`/order/${data.orderId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.server_error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-8">
      <div className="space-y-4">
        <h2 className="font-display text-xl font-700 uppercase tracking-[0.04em] text-ink">
          {t("shippingTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-silver sm:col-span-2"
          />
          <input
            required
            placeholder={t("phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-silver"
          />
          <input
            required
            placeholder={t("cityPlaceholder")}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-silver"
          />
          <textarea
            required
            placeholder={t("addressPlaceholder")}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-silver sm:col-span-2"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-xl font-700 uppercase tracking-[0.04em] text-ink">
          {t("paymentTitle")}
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
                {t(`payment.${method.id}.label` as "payment.cod.label")}
                {!method.available && ` ${t("paymentComingSoon")}`}
              </span>
              <span className="block text-sm text-ink-muted">
                {t(`payment.${method.id}.description` as "payment.cod.description")}
              </span>
            </span>
          </label>
        ))}
      </div>

      {userPoints > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-xl font-700 uppercase tracking-[0.04em] text-ink">
            {t("pointsTitle")}
          </h2>
          <p className="text-sm text-ink-muted">
            {t("pointsBalance", { points: userPoints })}
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
                {t("pointsRedeem", {
                  points: pointsToRedeem,
                  amount: formatPrice(discountCents, locale),
                })}
              </span>
            </div>
          ) : (
            <p className="text-sm text-ink-faint">
              {t("pointsMinNotice", { step: REDEEM_STEP })}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2 border-t border-line pt-6">
        <div className="flex justify-between text-ink-muted">
          <span>{t("subtotal")}</span>
          <span className="font-mono">{formatPrice(totalCents, locale)}</span>
        </div>
        {discountCents > 0 && (
          <div className="flex justify-between text-accent">
            <span>{t("discount")}</span>
            <span className="font-mono">−{formatPrice(discountCents, locale)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg text-ink">
          <span>{t("total")}</span>
          <span className="font-mono">{formatPrice(finalTotal, locale)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-accent px-6 py-4 font-display text-lg font-700 uppercase tracking-[0.14em] text-ink transition hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? t("submitting") : t("submit")}
      </button>
      <p className="text-center text-sm text-ink-faint">{t("whatsappNotice")}</p>
    </form>
  );
}
