import Link from "next/link";
import { SITE_NAME } from "@/lib/config";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg uppercase tracking-wide text-ink-muted">
              {SITE_NAME} <span className="text-ink-faint">— Rule the Streets</span>
            </p>
            <p className="mt-1 text-sm text-ink-faint">
              قطع محدودة، بقصة خاصة. كل نسخة مرقّمة، وما يفوتك ما يرجعش.
            </p>
          </div>
          <nav className="flex items-center gap-6 text-sm text-ink-muted">
            <Link href="/shop" className="transition hover:text-ink">المتجر</Link>
            <Link href="/account" className="transition hover:text-ink">حسابي</Link>
          </nav>
        </div>
        <p className="mt-8 text-xs text-ink-faint">
          © {new Date().getFullYear()} {SITE_NAME}. جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}
