"use client";

import { useTranslations } from "next-intl";

export function QuantityStepper({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (next: number) => void;
  max: number;
}) {
  const t = useTranslations("quantityStepper");

  return (
    <div className="inline-flex items-center border border-line">
      <button
        type="button"
        aria-label={t("decrease")}
        onClick={() => onChange(Math.max(1, value - 1))}
        className="flex h-9 w-9 items-center justify-center text-lg text-ink-muted transition hover:text-ink disabled:opacity-30"
        disabled={value <= 1}
      >
        −
      </button>
      <span className="w-8 text-center font-mono text-sm text-ink">{value}</span>
      <button
        type="button"
        aria-label={t("increase")}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-9 w-9 items-center justify-center text-lg text-ink-muted transition hover:text-ink disabled:opacity-30"
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}
