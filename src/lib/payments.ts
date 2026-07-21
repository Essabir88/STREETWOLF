// Payment methods available at checkout today, plus a documented extension
// point for adding a real card gateway later. See PAYMENTS.md for why Stripe
// is not the default for a Morocco-based store, and what to add instead
// (CMI, PayZone, or ChariBaaS) once the business side is registered.
export type PaymentMethodId = "cod";

export const PAYMENT_METHODS: {
  id: PaymentMethodId;
  label: string;
  description: string;
  available: boolean;
}[] = [
  {
    id: "cod",
    label: "الدفع عند الاستلام",
    description: "تدفع نقداً للمندوب عند وصول الطلب. بدون أي حساب أو رسوم إضافية.",
    available: true,
  },
];
