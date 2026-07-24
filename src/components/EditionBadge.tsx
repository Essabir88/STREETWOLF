import { getTranslations } from "next-intl/server";

/**
 * The numbered-plate treatment: every drop is a serigraph-style edition.
 * The depletion bar encodes real stock data — structure as information.
 */
export async function EditionBadge({
  totalStock,
  stockRemaining,
  size = "sm",
}: {
  totalStock: number;
  stockRemaining: number;
  size?: "sm" | "lg";
}) {
  const t = await getTranslations("edition");
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
          {t("limited")}
        </span>
        {soldOut ? (
          <span className="font-mono text-ink-muted">
            {t("soldOutCount", { total: totalStock })}
          </span>
        ) : (
          <span className={`font-mono ${low ? "text-accent" : "text-silver"}`}>
            {t("remaining", { remaining: stockRemaining, total: totalStock })}
          </span>
        )}
      </div>
      <div
        className={`edition-bar ${low ? "low" : ""}`}
        role="img"
        aria-label={soldOut ? t("soldOutAria") : t("percentSoldAria", { percent: pctGone })}
      >
        <span style={{ width: `${pctGone}%` }} />
      </div>
    </div>
  );
}
