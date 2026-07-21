"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { formatPrice, pointsToDiscountCents, REDEEM_STEP } from "@/lib/points";
import { PAYMENT_METHODS } from "@/lib/payments";

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
        السلة فارغة.{" "}
        <a href="/shop" className="text-ink underline">
          تصفّح المتجر
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
      if (!res.ok) throw new Error(data.error || "تعذر إتمام الطلب");
      clearCart();
      router.push(`/order/${data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-8">
      <div className="space-y-4">
        <h2 className="font-display text-lg uppercase tracking-wide text-ink">معلومات التوصيل</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="الاسم الكامل"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-accent sm:col-span-2"
          />
          <input
            required
            placeholder="رقم الهاتف"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-md border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-accent"
          />
          <input
            required
            placeholder="المدينة"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-md border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-accent"
          />
          <textarea
            required
            placeholder="العنوان الكامل"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="rounded-md border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-accent sm:col-span-2"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg uppercase tracking-wide text-ink">طريقة الدفع</h2>
        {PAYMENT_METHODS.map((method) => (
          <label
            key={method.id}
            className={`flex items-start gap-3 rounded-md border p-4 ${
              method.available ? "border-accent/50 bg-accent-soft" : "border-line opacity-50"
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
                {!method.available && " (قريباً)"}
              </span>
              <span className="block text-sm text-ink-muted">{method.description}</span>
            </span>
          </label>
        ))}
      </div>

      {userPoints > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg uppercase tracking-wide text-ink">استبدال النقاط</h2>
          <p className="text-sm text-ink-muted">
            رصيدك: <span className="font-mono text-ink">{userPoints}</span> نقطة
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
              <span className="w-40 shrink-0 font-mono text-sm text-ink">
                {pointsToRedeem} نقطة = -{formatPrice(discountCents)}
              </span>
            </div>
          ) : (
            <p className="text-sm text-ink-faint">تحتاج {REDEEM_STEP} نقطة على الأقل للاستبدال.</p>
          )}
        </div>
      )}

      <div className="space-y-2 border-t border-line pt-6">
        <div className="flex justify-between text-ink-muted">
          <span>المجموع الفرعي</span>
          <span className="font-mono">{formatPrice(totalCents)}</span>
        </div>
        {discountCents > 0 && (
          <div className="flex justify-between text-accent">
            <span>خصم النقاط</span>
            <span className="font-mono">-{formatPrice(discountCents)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg text-ink">
          <span>الإجمالي (يُدفع عند الاستلام)</span>
          <span className="font-mono">{formatPrice(finalTotal)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-accent px-6 py-4 font-display uppercase tracking-widest text-ink transition hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "جارٍ التأكيد..." : "تأكيد الطلب"}
      </button>
    </form>
  );
}
