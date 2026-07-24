import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/config";

export async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");

  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-xl font-700 uppercase tracking-[0.08em] text-ink-muted">
              {SITE_NAME} <span className="text-ink-faint">— {SITE_TAGLINE}</span>
            </p>
            <p className="mt-1 text-sm text-ink-faint">{t("tagline")}</p>
          </div>
          <nav className="flex items-center gap-6 text-sm text-ink-muted">
            <Link href="/shop" className="transition hover:text-ink">
              {tNav("shop")}
            </Link>
            <Link href="/account" className="transition hover:text-ink">
              {tNav("account")}
            </Link>
          </nav>
        </div>
        <p className="mt-8 font-mono text-xs text-ink-faint">
          © {new Date().getFullYear()} {SITE_NAME}. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
