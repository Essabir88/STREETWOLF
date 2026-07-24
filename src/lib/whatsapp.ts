import { formatPrice } from "@/lib/points";
import type { Locale } from "@/i18n/routing";

/**
 * The store's WhatsApp number in international format WITHOUT "+" or spaces,
 * e.g. "212612345678" for a Moroccan mobile. If unset, all WhatsApp buttons
 * are hidden — the feature is opt-in via env var.
 *
 * NEXT_PUBLIC_ because the wa.me link must work client-side; the number is
 * public by nature (customers message it), so exposing it is intended.
 */
export const WHATSAPP_NUMBER = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""
).replace(/[^0-9]/g, "");

export type WhatsAppOrderInput = {
  orderId: string;
  items: {
    productName: string;
    size: string | null;
    quantity: number;
    priceCents: number;
  }[];
  totalCents: number;
  discountCents: number;
  shippingName: string;
  shippingPhone: string;
  // Only the city is included in the prefilled message, not the street
  // address — a wa.me URL can end up logged (browser history, analytics,
  // proxies), and the full delivery address isn't needed there since it's
  // already stored server-side and shown on the order confirmation page.
  shippingCity: string;
};

const LABELS: Record<
  Locale,
  {
    title: (id: string) => string;
    discount: string;
    total: (amount: string) => string;
    confirm: string;
  }
> = {
  fr: {
    title: (id) => `🐺 *Street Wolf — Commande #${id}*`,
    discount: "Réduction points",
    total: (amount) => `*Total à la livraison : ${amount}*`,
    confirm: "Je confirme ma commande ✅",
  },
  en: {
    title: (id) => `🐺 *Street Wolf — Order #${id}*`,
    discount: "Points discount",
    total: (amount) => `*Total due on delivery: ${amount}*`,
    confirm: "I confirm my order ✅",
  },
  ar: {
    title: (id) => `🐺 *Street Wolf — طلب #${id}*`,
    discount: "خصم النقاط",
    total: (amount) => `*المجموع عند التسليم: ${amount}*`,
    confirm: "أؤكد طلبي ✅",
  },
};

/** Builds the wa.me deep link with a prefilled order summary in the given locale. */
export function buildOrderWhatsAppLink(
  order: WhatsAppOrderInput,
  locale: Locale = "fr"
): string | null {
  if (!WHATSAPP_NUMBER) return null;
  const t = LABELS[locale];

  const lines = [
    t.title(order.orderId.slice(0, 8)),
    "",
    ...order.items.map(
      (it) =>
        `• ${it.quantity} × ${it.productName}${it.size ? ` (${it.size})` : ""} — ${formatPrice(it.priceCents * it.quantity, locale)}`
    ),
    "",
    ...(order.discountCents > 0
      ? [`${t.discount} : −${formatPrice(order.discountCents, locale)}`]
      : []),
    t.total(formatPrice(order.totalCents, locale)),
    "",
    `📍 ${order.shippingName} — ${order.shippingPhone}`,
    order.shippingCity,
    "",
    t.confirm,
  ];

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}
