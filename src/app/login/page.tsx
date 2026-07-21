"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [next, setNext] = useState("/account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reading location.search has to happen after mount (see CartContext.tsx
  // for why this can't move into a lazy useState initializer).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNext(params.get("next") || "/account");
  }, []);

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
      if (!res.ok) throw new Error(data.error || "تعذر تسجيل الدخول");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <h1 className="font-display text-3xl uppercase tracking-wide text-ink">تسجيل الدخول</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm text-ink-muted">البريد الإلكتروني</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-ink-muted">كلمة السر</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-accent"
          />
        </div>
        {error && <p className="text-sm text-accent">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent px-6 py-3 font-display uppercase tracking-widest text-ink transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "..." : "دخول"}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink-muted">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="text-ink underline">أنشئ حساباً</Link>
      </p>
    </div>
  );
}
