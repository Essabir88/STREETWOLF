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
    label: "Paiement à la livraison",
    description:
      "Payez en espèces au livreur à la réception. Aucun compte, aucuns frais supplémentaires.",
    available: true,
  },
];
