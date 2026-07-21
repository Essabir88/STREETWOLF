/** How many loyalty points a customer earns per whole MAD (Moroccan Dirham) spent. */
export const POINTS_PER_MAD = Number(process.env.POINTS_PER_MAD || 1);

/** How many MAD (in cents) one redeemed point is worth at checkout. */
export const MAD_CENTS_PER_POINT = Number(
  process.env.MAD_CENTS_PER_POINT || 10
);

/** Redeem points only in blocks of this size, to keep the math predictable. */
export const REDEEM_STEP = 50;

export function pointsForTotal(totalCents: number) {
  return Math.floor((totalCents / 100) * POINTS_PER_MAD);
}

export function pointsToDiscountCents(points: number) {
  return points * MAD_CENTS_PER_POINT;
}

/** Formats a price stored as integer centimes into a Moroccan Dirham string. */
export function formatPrice(cents: number) {
  const value = (cents / 100).toLocaleString("ar-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${value} درهم`;
}
