/**
 * The numbered-plate treatment: every drop is a serigraph-style edition.
 * The depletion bar encodes real stock data — structure as information.
 */
export function EditionBadge({
  totalStock,
  stockRemaining,
  size = "sm",
}: {
  totalStock: number;
  stockRemaining: number;
  size?: "sm" | "lg";
}) {
  const soldOut = stockRemaining <= 0;
  const low = !soldOut && stockRemaining / totalStock <= 0.15;
  const pctGone = Math.round(((totalStock - stockRemaining) / totalStock) * 100);

  return (
    <div className={size === "lg" ? "space-y-2" : "space-y-1.5"}>
      <div
        className={`flex items-baseline justify-between gap-3 ${
          size === "lg" ? "text-sm" : "text-xs"
        }`}
      >
        <span className="font-medium uppercase tracking-[0.14em] text-ink-faint">
          Édition limitée
        </span>
        {soldOut ? (
          <span className="font-mono text-ink-muted">
            {totalStock}/{totalStock} — épuisé
          </span>
        ) : (
          <span className={`font-mono ${low ? "text-accent" : "text-silver"}`}>
            reste {stockRemaining}/{totalStock}
          </span>
        )}
      </div>
      <div
        className={`edition-bar ${low ? "low" : ""}`}
        role="img"
        aria-label={
          soldOut
            ? "Édition épuisée"
            : `${pctGone} % de l'édition déjà vendue`
        }
      >
        <span style={{ width: `${pctGone}%` }} />
      </div>
    </div>
  );
}
