import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { PaperCard } from '@components/paper-card';
import { ProgressLine } from '@components/progress-line';
import { useHistoryStore } from '../stores/history.store';
import { formatCardNo } from '../utils/questions';

const SHEET_SPRING = { type: 'spring', stiffness: 300, damping: 28 } as const;
const TOTAL = 52;

export default function HistoryPage() {
  const entries = useHistoryStore((s) => s.entries);
  const expandedId = useHistoryStore((s) => s.expandedId);
  const toggleExpand = useHistoryStore((s) => s.toggleExpand);
  const close = useHistoryStore((s) => s.close);

  const expanded = entries.find((e) => e.id === expandedId) ?? null;

  return (
    <div className="relative min-h-screen bg-transparent antialiased">
      {/* immersive paper background */}
      <div aria-hidden className="absolute inset-0 z-0 bg-surface-base">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: 'var(--texture-noise)' }}
        />
      </div>

      {/* content layer — owns both safe-area edges */}
      <div className="relative z-10 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
        {/* top bar: title + close */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border-subtle bg-surface-base/85 px-comfortable pb-snug pt-base backdrop-blur-md">
          <h1 className="font-zh text-body-lg font-semibold tracking-widest text-text-primary">
            往期牌堆
          </h1>
          <button
            type="button"
            aria-label="关闭，回到抽卡台"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors duration-200 hover:bg-surface-raised hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-ring active:scale-95"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </header>

        {entries.length === 0 ? (
          /* empty pile */
          <div className="flex flex-col items-center px-comfortable pt-section-y text-center">
            <p className="font-display text-h3 font-semibold text-brand-primary">№ 00</p>
            <span aria-hidden className="mt-comfortable h-px w-10 bg-border-strong" />
            <p className="mt-comfortable max-w-[260px] font-zh text-body leading-relaxed text-text-muted">
              牌堆还空着。回到抽卡台，上划抽起第一张卡。
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-stack-md rounded-full border border-brand-primary/25 bg-surface-raised px-comfortable py-snug font-zh text-body text-brand-primary transition-all duration-300 hover:bg-brand-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-ring active:scale-[0.97]"
            >
              回到抽卡台
            </button>
          </div>
        ) : (
          /* drawn entries, newest first */
          <main className="mx-auto w-full max-w-[520px] px-comfortable pt-base">
            <ul className="flex flex-col">
              {entries.map((entry, index) => {
                const isOpen = expandedId === entry.id;
                return (
                  <li
                    key={entry.id}
                    className={index === 0 ? '' : 'border-t border-border-subtle'}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpand(entry.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-start gap-base px-micro py-base text-left transition-colors duration-200 hover:bg-surface-raised/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-status-focus-ring"
                    >
                      <span className="shrink-0 pt-[3px] font-display text-caption font-semibold tracking-wider text-brand-primary">
                        № {formatCardNo(entry.id)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block font-zh text-body leading-relaxed text-text-primary ${
                            isOpen ? '' : 'line-clamp-2'
                          }`}
                        >
                          {entry.text}
                        </span>
                      </span>
                      <ChevronDown
                        size={15}
                        strokeWidth={1.8}
                        className={`mt-1 shrink-0 text-text-muted transition-transform duration-300 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key={`open-${entry.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-micro pb-comfortable">
                            <PaperCard ornate className="px-comfortable py-stack-md">
                              <p className="text-center font-display text-body-lg font-semibold text-brand-primary">
                                № {formatCardNo(entry.id)}
                              </p>
                              <span
                                aria-hidden
                                className="mx-auto mt-snug block h-px w-8 bg-border-strong"
                              />
                              <p className="mt-snug text-center font-zh text-body-lg leading-relaxed text-text-primary">
                                {entry.text}
                              </p>
                            </PaperCard>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>

            <div className="py-stack-md">
              <ProgressLine drawn={entries.length} total={TOTAL} />
            </div>
          </main>
        )}
      </div>

      {/* expanded reading card is inline above; no extra overlay needed.
          `expanded` kept for a11y future use without breaking no-unused vars. */}
      <span className="hidden" aria-live="polite">
        {expanded ? `正在重读第 ${formatCardNo(expanded.id)} 张` : ''}
      </span>
    </div>
  );
}
