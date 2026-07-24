"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth.login");
  const tErrors = useTranslations("auth.errors");
  const tValidation = useTranslations("validation");
  const [next, setNext] = useState("/account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reading location.search has to happen after mount (see CartContext.tsx
  // for why this can’t move into a lazy useState initializer).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNext(params.get("next") || "/account");
  }, []);

  const resolveError = (code: string | undefined) => {
    if (!code) return tErrors("generic_login");
    if (tErrors.has(code)) return tErrors(code);
    if (tValidation.has(code)) return tValidation(code);
    return tErrors("generic_login");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(resolveError(data.error));
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tErrors("generic_login"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <div className="claw-divider mb-4" />
      <h1 className="font-display text-4xl font-700 uppercase tracking-[0.04em] text-ink">
        {t("title")}
      </h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm text-ink-muted">{t("email")}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-silver"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-ink-muted">{t("password")}</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-silver"
          />
        </div>
        {error && <p className="text-sm text-accent">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent px-6 py-3 font-display text-lg font-700 uppercase tracking-[0.14em] text-ink transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? t("loading") : t("submit")}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink-muted">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-ink underline">
          {t("createAccount")}
        </Link>
      </p>
    </div>
  );
}
