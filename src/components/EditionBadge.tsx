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

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-medium ${
        size === "lg" ? "text-sm" : "text-xs"
      } ${
        low
          ? "border-accent/50 bg-accent-soft text-accent"
          : "border-line text-ink-faint"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          soldOut ? "bg-ink-faint" : low ? "bg-accent" : "bg-ink-muted"
        }`}
      />
      {soldOut ? (
        <span>
          نسخة من <span className="font-mono">{totalStock}</span> — نفدت الكمية
        </span>
      ) : (
        <span>
          تبقّى <span className="font-mono">{stockRemaining}</span> من{" "}
          <span className="font-mono">{totalStock}</span>
        </span>
      )}
    </div>
  );
}
