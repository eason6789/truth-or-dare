interface ProgressLineProps {
  drawn: number;
  total: number;
}

/**
 * Bottom progress zone per frozen IA:
 * one thin berry line with a node dot at the head + 「已抽 n / 52」caption.
 */
export function ProgressLine({ drawn, total }: ProgressLineProps) {
  const ratio = total > 0 ? Math.min(1, Math.max(0, drawn / total)) : 0;
  return (
    <div className="flex flex-col items-center gap-snug">
      <div
        className="relative h-[2px] w-full max-w-[240px] overflow-visible rounded-full bg-border-subtle"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={drawn}
        aria-label={`已抽 ${drawn} / ${total}`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-brand-primary transition-all duration-500"
          style={{
            width: `${ratio * 100}%`,
            transitionTimingFunction: 'var(--ease-paper-settle)',
          }}
        />
        <span
          aria-hidden
          className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-brand-primary bg-surface-raised transition-all duration-500"
          style={{
            left: `calc(${ratio * 100}% - 4px)`,
            transitionTimingFunction: 'var(--ease-paper-settle)',
          }}
        />
      </div>
      <p className="font-zh text-caption tracking-widest text-text-muted">
        已抽 {drawn} / {total}
      </p>
    </div>
  );
}
