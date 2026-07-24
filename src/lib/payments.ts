// Payment methods available at checkout today, plus a documented extension
// point for adding a real card gateway later. See PAYMENTS.md for why Stripe
// is not the default for a Morocco-based store, and what to add instead
// (CMI, PayZone, or ChariBaaS) once the business side is registered.
//
// Labels/descriptions live in messages/*.json under `checkout.payment.<id>`
// (see CheckoutForm.tsx) — this module only tracks which methods exist and
// whether they're currently available, keeping it presentation-independent.
export type PaymentMethodId = "cod";

export const PAYMENT_METHODS: {
  id: PaymentMethodId;
  available: boolean;
}[] = [{ id: "cod", available: true }];
