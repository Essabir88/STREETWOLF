"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [next, setNext] = useState("/account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر إنشاء الحساب");
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
      <h1 className="font-display text-3xl uppercase tracking-wide text-ink">إنشاء حساب</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm text-ink-muted">الاسم الكامل</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-accent"
          />
        </div>
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
          <label className="mb-1.5 block text-sm text-ink-muted">رقم الهاتف (اختياري)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md border border-line bg-surface-1 px-4 py-3 text-ink outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-ink-muted">كلمة السر (8 خانات على الأقل)</label>
          <input
            type="password"
            required
            minLength={8}
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
          {loading ? "..." : "إنشاء الحساب"}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink-muted">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="text-ink underline">سجّل الدخول</Link>
      </p>
    </div>
  );
}
