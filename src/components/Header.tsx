"use client";

import Link from "next/link";
import { useCart } from "./CartContext";
import { SITE_NAME } from "@/lib/config";

export function Header({
  isLoggedIn,
  points,
}: {
  isLoggedIn: boolean;
  points: number | null;
}) {
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link
          href="/"
          className="font-display text-[26px] font-900 uppercase tracking-[0.08em] text-ink"
        >
          {SITE_NAME}
          <span className="text-accent">.</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-ink-muted sm:flex">
          <Link href="/shop" className="transition hover:text-ink">
            Boutique
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/account"
              className="hidden items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:border-silver hover:text-ink sm:flex"
            >
              <span className="text-accent">●</span>
              <span className="font-mono">{points ?? 0}</span> pts
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden text-sm font-medium text-ink-muted transition hover:text-ink sm:block"
            >
              Connexion
            </Link>
          )}

          <Link
            href="/cart"
            aria-label={`Panier, ${totalItems} article${totalItems > 1 ? "s" : ""}`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition hover:border-silver"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M3 6h2l2.4 12.2a2 2 0 0 0 2 1.8h8.2a2 2 0 0 0 2-1.6L21 8H6" />
              <circle cx="10" cy="21" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="18" cy="21" r="1.4" fill="currentColor" stroke="none" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold text-ink">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
