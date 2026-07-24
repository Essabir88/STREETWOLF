import type { Locale } from "@/i18n/routing";

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

// The store only ever charges in Moroccan Dirham — there's no multi-currency
// conversion here, only the label/number formatting changes per locale.
const CURRENCY_SUFFIX: Record<Locale, string> = {
  fr: "DH",
  en: "MAD",
  ar: "د.م.",
};

const INTL_LOCALE: Record<Locale, string> = {
  fr: "fr-MA",
  en: "en-US",
  ar: "ar-MA",
};

/** Formats a price stored in cents as a dirham string in the given locale. */
export function formatPrice(cents: number, locale: Locale = "fr") {
  // "-u-nu-latn" forces Western Arabic numerals even for the ar-MA locale —
  // Morocco uses Western digits day-to-day, unlike e.g. ar-EG, and relying
  // on the runtime's default numbering system would be a silent regression
  // depending on which ICU data the deployment target ships.
  const value = (cents / 100).toLocaleString(`${INTL_LOCALE[locale]}-u-nu-latn`, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${value} ${CURRENCY_SUFFIX[locale]}`;
}
