import { forwardRef, type CSSProperties, type ReactNode } from 'react';

interface PaperCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Show the small berry corner ornaments (top card only). */
  ornate?: boolean;
}

/**
 * Frosted specialty-paper card shell.
 * Raised warm paper surface + subtle border + layered low-alpha shadow +
 * top-edge luster + faint grain. Purely presentational.
 */
export const PaperCard = forwardRef<HTMLDivElement, PaperCardProps>(
  function PaperCard({ children, className = '', style, ornate = false }, ref) {
    return (
      <div
        ref={ref}
        className={`relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised shadow-xl ${className}`}
        style={style}
      >
        {/* top-edge paper luster */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px"
          style={{ background: 'hsl(var(--color-surface-raised) / 0.9)' }}
        />
        {/* fine paper grain */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{ backgroundImage: 'var(--texture-noise)' }}
        />
        {ornate && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute left-5 top-5 z-10 h-1.5 w-1.5 rounded-full bg-brand-primary/30"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-5 right-5 z-10 h-1.5 w-1.5 rounded-full bg-brand-primary/30"
            />
          </>
        )}
        {children}
      </div>
    );
  }
);
