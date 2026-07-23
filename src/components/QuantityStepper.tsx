"use client";

export function QuantityStepper({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (next: number) => void;
  max: number;
}) {
  return (
    <div className="inline-flex items-center border border-line">
      <button
        type="button"
        aria-label="Diminuer la quantité"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="flex h-9 w-9 items-center justify-center text-lg text-ink-muted transition hover:text-ink disabled:opacity-30"
        disabled={value <= 1}
      >
        −
      </button>
      <span className="w-8 text-center font-mono text-sm text-ink">{value}</span>
      <button
        type="button"
        aria-label="Augmenter la quantité"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-9 w-9 items-center justify-center text-lg text-ink-muted transition hover:text-ink disabled:opacity-30"
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}
