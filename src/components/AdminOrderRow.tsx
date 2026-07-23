"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/points";

type OrderItem = {
  id: string;
  productName: string;
  size: string | null;
  quantity: number;
  priceCents: number;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En traitement",
  confirmed: "Confirmée",
  fulfilled: "Livrée",
  cancelled: "Annulée",
};

const NEXT_ACTIONS: Record<string, { to: string; label: string }[]> = {
  pending: [
    { to: "confirmed", label: "Confirmer" },
    { to: "cancelled", label: "Annuler" },
  ],
  confirmed: [
    { to: "fulfilled", label: "Marquer livrée" },
    { to: "cancelled", label: "Annuler" },
  ],
  fulfilled: [],
  cancelled: [],
};

export function AdminOrderRow({
  order,
}: {
  order: {
    id: string;
    status: string;
    totalCents: number;
    pointsRedeemed: number;
    createdAt: string;
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    shippingCity: string;
    items: OrderItem[];
  };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setStatus = async (status: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la mise à jour");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const actions = NEXT_ACTIONS[order.status] ?? [];

  return (
    <div className="edition-plate p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-ink">#{order.id.slice(0, 8)}</p>
          <p className="text-sm text-ink-faint">
            {new Date(order.createdAt).toLocaleString("fr-MA")}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg text-ink">{formatPrice(order.totalCents)}</p>
          <p className="text-sm text-ink-muted">{STATUS_LABELS[order.status] ?? order.status}</p>
        </div>
      </div>

      <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
        {order.items.map((it) => (
          <p key={it.id} className="text-ink-muted">
            {it.quantity} × {it.productName}
            {it.size ? ` (${it.size})` : ""} —{" "}
            <span className="font-mono">{formatPrice(it.priceCents * it.quantity)}</span>
          </p>
        ))}
        {order.pointsRedeemed > 0 && (
          <p className="text-accent">
            Points échangés : <span className="font-mono">{order.pointsRedeemed}</span>
          </p>
        )}
      </div>

      <div className="mt-3 border-t border-line pt-3 text-sm text-ink-muted">
        <p className="text-ink">{order.shippingName} — {order.shippingPhone}</p>
        <p>{order.shippingAddress}, {order.shippingCity}</p>
      </div>

      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((a) => (
            <button
              key={a.to}
              type="button"
              disabled={busy}
              onClick={() => setStatus(a.to)}
              className={`px-4 py-2 text-sm font-medium transition disabled:opacity-40 ${
                a.to === "cancelled"
                  ? "border border-line text-ink-muted hover:border-accent hover:text-accent"
                  : "bg-accent text-ink hover:opacity-90"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-accent">{error}</p>}
    </div>
  );
}
