import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

if (!key) {
  // Thrown only when a route actually tries to use Stripe, not at build time.
  console.warn(
    "STRIPE_SECRET_KEY is not set. Checkout and webhooks will fail until it is."
  );
}

export const stripe = new Stripe(key || "sk_test_missing", {
  apiVersion: "2026-06-24.dahlia",
});
