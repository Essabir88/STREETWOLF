import { formatPrice } from "@/lib/points";

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
  shippingAddress: string;
  shippingCity: string;
};

/** Builds the wa.me deep link with a prefilled French order summary. */
export function buildOrderWhatsAppLink(order: WhatsAppOrderInput): string | null {
  if (!WHATSAPP_NUMBER) return null;

  const lines = [
    `🐺 *Street Wolf — Commande #${order.orderId.slice(0, 8)}*`,
    "",
    ...order.items.map(
      (it) =>
        `• ${it.quantity} × ${it.productName}${it.size ? ` (${it.size})` : ""} — ${formatPrice(it.priceCents * it.quantity)}`
    ),
    "",
    ...(order.discountCents > 0
      ? [`Réduction points : −${formatPrice(order.discountCents)}`]
      : []),
    `*Total à la livraison : ${formatPrice(order.totalCents)}*`,
    "",
    `📍 ${order.shippingName} — ${order.shippingPhone}`,
    `${order.shippingAddress}, ${order.shippingCity}`,
    "",
    "Je confirme ma commande ✅",
  ];

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}
