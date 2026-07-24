import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en", "ar"],
  defaultLocale: "fr",
  // Every locale is always prefixed (including the default) so a URL always
  // maps to exactly one language — simpler canonical URLs for SEO and no
  // ambiguity when building the sitemap's alternates.languages.
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const RTL_LOCALES: readonly Locale[] = ["ar"];

export function isRtl(locale: Locale) {
  return RTL_LOCALES.includes(locale);
}
