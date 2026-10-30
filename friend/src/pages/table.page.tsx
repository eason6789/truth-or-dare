import { useEffect, useRef } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import { ArrowUp, Layers, Settings } from 'lucide-react';
import { PaperCard } from '@components/paper-card';
import { ProgressLine } from '@components/progress-line';
import { useTableStore } from '../stores/table.store';
import {
  formatCardNo,
  getQuestionById,
  getQuestions,
} from '../utils/questions';
import {
  playFlip,
  playSettle,
  playWhoosh,
  setSoundMuted,
} from '../utils/sound';

/** Spring for the drawn card settling onto the table — damped, heavy paper. */
const SETTLE_SPRING = { type: 'spring', stiffness: 300, damping: 25 } as const;
const SKIP_EASE = [0.16, 1, 0.3, 1] as const;

interface CardFaceProps {
  id: number;
  dimmed?: boolean;
}

/** Card face: big 题号 + centered question, generous inner whitespace. */
function CardFace({ id, dimmed = false }: CardFaceProps) {
  const question = getQuestionById(id);
  return (
    <div
      className={`flex h-full flex-col items-center justify-center px-loose py-stack-lg text-center transition-opacity duration-300 ${
        dimmed ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <p className="font-display text-h1 font-bold leading-none tracking-tight text-brand-primary">
        № {formatCardNo(id)}
      </p>
      <span aria-hidden className="mt-comfortable h-px w-10 bg-border-strong" />
      <h2 className="mt-comfortable font-zh text-h3 font-semibold leading-snug tracking-tight text-text-primary">
        {question?.text ?? ''}
      </h2>
    </div>
  );
}

/** Quiet reading-light vignette behind the pile. */
function Backdrop() {
  return (
    <div aria-hidden className="absolute inset-0 z-0 bg-surface-base">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 70% at 50% 32%, hsl(var(--color-surface-raised) / 0.75), hsl(var(--color-surface-base) / 0) 62%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundImage: 'var(--texture-noise)' }}
      />
    </div>
  );
}

export default function TablePage() {
  const deck = useTableStore((s) => s.deck);
  const drawnIds = useTableStore((s) => s.drawnIds);
  const activeId = useTableStore((s) => s.activeId);
  const outgoingId = useTableStore((s) => s.outgoingId);
  const phase = useTableStore((s) => s.phase);
  const soundOn = useTableStore((s) => s.soundOn);
  const settingsOpen = useTableStore((s) => s.settingsOpen);
  const resetArmed = useTableStore((s) => s.resetArmed);
  const dragResetKey = useTableStore((s) => s.dragResetKey);
  const beginDraw = useTableStore((s) => s.beginDraw);
  const settleDraw = useTableStore((s) => s.settleDraw);
  const beginSkip = useTableStore((s) => s.beginSkip);
  const settleSkip = useTableStore((s) => s.settleSkip);
  const cancelGesture = useTableStore((s) => s.cancelGesture);
  const openSettings = useTableStore((s) => s.openSettings);
  const closeSettings = useTableStore((s) => s.closeSettings);
  const toggleSound = useTableStore((s) => s.toggleSound);
  const requestReset = useTableStore((s) => s.requestReset);
  const loadQuestions = useTableStore((s) => s.loadQuestions);

  useEffect(() => {
    setSoundMuted(!soundOn);
  }, [soundOn]);

  // 运行时从后端拉取题库（替换内置 store.json 题目）
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // 隐藏管理入口：1.5s 内连续点标题「莓辣 · 照见卡牌」5 次 → 进入题库管理页
  const adminTaps = useRef(0);
  const adminTapTimer = useRef<number | undefined>(undefined);
  const onAdminTap = () => {
    adminTaps.current += 1;
    window.clearTimeout(adminTapTimer.current);
    adminTapTimer.current = window.setTimeout(() => {
      adminTaps.current = 0;
    }, 1500);
    if (adminTaps.current >= 5) {
      adminTaps.current = 0;
      window.clearTimeout(adminTapTimer.current);
      window.location.assign('/truth-or-dare/admin.html?edition=friend');
    }
  };

  // Gesture motion values for the top draggable card.
  const dragY = useMotionValue(0);
  const dragX = useMotionValue(0);
  const liftProgress = useTransform(dragY, [0, -260], [0, 1], { clamp: true });
  const underScale = useTransform(liftProgress, [0, 1], [0.955, 1]);
  const underY = useTransform(liftProgress, [0, 1], [14, 0]);
  const underRotate = useTransform(liftProgress, [0, 1], [-2.4, 0]);
  const flyX = useTransform(dragX, [0, 1], [0, 1]); // passthrough for skip flight

  const drawn = drawnIds.length;
  const topId = activeId ?? deck[0] ?? null;
  const underId = activeId !== null ? deck[0] ?? null : deck[1] ?? null;
  const thirdId = activeId !== null ? deck[1] ?? null : deck[2] ?? null;
  const idle = phase === 'idle';
  const total = getQuestions().length || 52;
  const hasCards = getQuestions().length > 0;

  const commitDraw = () => {
    if (!idle || deck.length === 0) return;
    playFlip();
    beginDraw();
  };

  const commitSkip = () => {
    if (!idle || activeId === null) return;
    playWhoosh();
    beginSkip();
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-transparent antialiased">
      <Backdrop />

      {/* content layer — owns both safe-area edges */}
      <div
        className="relative z-10 flex h-full flex-col"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* top slim brand bar */}
        <header className="flex shrink-0 items-center justify-between px-comfortable pt-base">
          <p
            onClick={onAdminTap}
            className="font-zh text-caption tracking-[0.35em] text-text-muted"
          >
            莓辣 · 照见卡牌
          </p>
          <button
            type="button"
            aria-label="偏好设定"
            onClick={openSettings}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors duration-200 hover:bg-surface-raised hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-ring active:scale-95"
          >
            <Settings size={18} strokeWidth={1.8} />
          </button>
        </header>

        {/* central pile zone (~58% of screen) */}
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-comfortable">
          <div className="relative aspect-[5/7] w-full max-w-[292px]">
            {/* third card — deepest layer */}
            {thirdId !== null && phase !== 'complete' && (
              <PaperCard
                className="absolute inset-0"
                style={{
                  transform: 'translateY(26px) rotate(3.2deg) scale(0.91)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div className="h-full opacity-0" />
              </PaperCard>
            )}

            {/* second card — rises as the top card lifts */}
            {underId !== null && phase !== 'complete' && (
              <motion.div
                className="absolute inset-0"
                style={
                  idle
                    ? { scale: underScale, y: underY, rotate: underRotate }
                    : { scale: 0.955, y: 14, rotate: -2.4 }
                }
              >
                <PaperCard className="h-full" style={{ boxShadow: 'var(--shadow-lg)' }}>
                  <div className="h-full opacity-0" />
                </PaperCard>
              </motion.div>
            )}

            {/* settled top card (draggable) */}
            {topId !== null && phase !== 'complete' && (
              <motion.div
                key={`top-${topId}-${dragResetKey}`}
                className="absolute inset-0 z-10 touch-none"
                style={{ y: dragY, x: dragX }}
                drag={idle}
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={{ top: 0.85, bottom: 0.06, left: 0.55, right: 0.55 }}
                dragTransition={{ bounceStiffness: 220, bounceDamping: 26 }}
                whileDrag={{ cursor: 'grabbing' }}
                onDragEnd={(_e, info) => {
                  if (!idle) return;
                  const upEnough = info.offset.y < -110 || info.velocity.y < -450;
                  const sideEnough =
                    activeId !== null &&
                    (Math.abs(info.offset.x) > 120 || Math.abs(info.velocity.x) > 500);
                  if (upEnough) {
                    commitDraw();
                  } else if (sideEnough) {
                    commitSkip();
                  } else {
                    cancelGesture();
                  }
                }}
                onTap={() => {
                  // 克制的点击备选：轻点牌叠抽起新卡（桌面预览友好）
                  if (idle) commitDraw();
                }}
              >
                <PaperCard ornate className="h-full active:scale-[0.99] transition-transform duration-300">
                  <CardFace id={topId} />
                </PaperCard>
              </motion.div>
            )}

            {/* outgoing card — draw settle / skip fly-out */}
            <AnimatePresence>
              {phase === 'drawing' && outgoingId !== null && (
                <motion.div
                  key={`draw-${outgoingId}`}
                  className="absolute inset-0 z-20"
                  initial={{ y: '-118%', rotate: -2, scale: 1.02, opacity: 0.96 }}
                  animate={{ y: 0, rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={SETTLE_SPRING}
                  onAnimationComplete={() => {
                    playSettle();
                    settleDraw();
                  }}
                >
                  <PaperCard ornate className="h-full">
                    <CardFace id={outgoingId} />
                  </PaperCard>
                </motion.div>
              )}
              {phase === 'skipping' && outgoingId !== null && (
                <motion.div
                  key={`skip-${outgoingId}`}
                  className="absolute inset-0 z-20"
                  initial={{ x: flyX.get() * 0, y: 0, rotate: 0, opacity: 1 }}
                  animate={{
                    x: dragX.get() >= 0 ? 520 : -520,
                    y: -24,
                    rotate: dragX.get() >= 0 ? 14 : -14,
                    opacity: 0,
                  }}
                    exit={{ opacity: 0 }}
                  transition={{ duration: 0.34, ease: SKIP_EASE }}
                  onAnimationComplete={() => settleSkip()}
                >
                  <PaperCard ornate className="h-full">
                    <CardFace id={outgoingId} />
                  </PaperCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* complete state — quiet pile back + closing words */}
            {phase === 'complete' && (
              <motion.div
                key="complete"
                className="absolute inset-0"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: SKIP_EASE }}
              >
                <PaperCard className="flex h-full flex-col items-center justify-center px-loose text-center">
                  <p className="font-display text-h3 font-semibold text-brand-primary">
                    № {total}
                  </p>
                  <span aria-hidden className="mt-comfortable h-px w-10 bg-border-strong" />
                  <h2 className="mt-comfortable font-zh text-h3 font-semibold leading-snug text-text-primary">
                    五十二张，都见过了
                  </h2>
                  <p className="mt-snug font-zh text-body leading-relaxed text-text-muted">
                    那些没说完的话，就留到灯下继续。
                  </p>
                  <button
                    type="button"
                    onClick={requestReset}
                    className="mt-stack-md rounded-full border border-brand-primary/25 bg-surface-base px-comfortable py-snug font-zh text-body text-brand-primary transition-all duration-300 hover:bg-brand-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-ring active:scale-[0.97]"
                  >
                    重置，再来一轮
                  </button>
                </PaperCard>
              </motion.div>
            )}
          </div>

          {/* gesture hint — only before the very first draw */}
          {idle && drawn === 0 && activeId === null && hasCards && (
            <motion.p
              className="mt-stack-md flex items-center gap-tight font-zh text-caption tracking-widest text-text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <ArrowUp size={13} strokeWidth={1.8} />
              上划抽卡 · 左右滑切题
            </motion.p>
          )}
        </main>

        {/* bottom progress zone — tap to open 往期牌堆 */}
        <footer className="shrink-0 px-comfortable pb-comfortable">
          <button
            type="button"
            onClick={() => window.App.transitionTo('history')}
            aria-label="查看往期牌堆"
            className="group flex w-full flex-col items-center gap-tight rounded-xl px-base py-snug transition-colors duration-200 hover:bg-surface-raised/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-ring"
          >
            <span className="flex items-center gap-tight font-zh text-caption tracking-widest text-text-muted transition-colors group-hover:text-text-primary">
              <Layers size={13} strokeWidth={1.8} />
              往期牌堆
            </span>
            <span className="w-full">
              <ProgressLine drawn={drawn} total={total} />
            </span>
          </button>
        </footer>
      </div>

      {/* 偏好设定 — half-screen bottom sheet, sibling of content (above everything) */}
      <AnimatePresence>
        {settingsOpen && (
          <>
            <motion.div
              key="scrim"
              className="fixed inset-0 z-[60]"
              style={{ background: 'hsl(var(--color-surface-glass-dark) / 0.35)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeSettings}
            />
            <motion.div
              key="sheet"
              className="fixed bottom-0 left-0 right-0 z-[70] overflow-hidden rounded-t-3xl border-t border-border-subtle bg-surface-raised"
              style={{
                boxShadow: 'var(--shadow-xl)',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={SETTLE_SPRING}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_e, info) => {
                if (info.offset.y > 90 || info.velocity.y > 400) closeSettings();
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: 'var(--texture-noise)' }}
              />
              <div className="relative flex flex-col px-comfortable pb-stack-md pt-snug">
                <span
                  aria-hidden
                  className="mx-auto h-1 w-10 rounded-full bg-border-strong"
                />
                <h3 className="mt-base text-center font-zh text-body-lg font-semibold text-text-primary">
                  偏好设定
                </h3>

                {/* 音效开关 */}
                <div className="mt-stack-md flex items-center justify-between border-t border-border-subtle py-base">
                  <div>
                    <p className="font-zh text-body text-text-primary">音效</p>
                    <p className="mt-micro font-zh text-caption text-text-muted">
                      翻牌与落位声
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={soundOn}
                    aria-label="音效开关"
                    onClick={toggleSound}
                    className={`relative h-7 w-12 rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-ring ${
                      soundOn ? 'bg-brand-primary' : 'bg-border-strong'
                    }`}
                  >
                    <motion.span
                      className="absolute top-0.5 h-6 w-6 rounded-full bg-surface-raised shadow-sm"
                      animate={{ left: soundOn ? 22 : 2 }}
                      transition={SETTLE_SPRING}
                    />
                  </button>
                </div>

                {/* 重置进度 */}
                <div className="flex items-center justify-between border-t border-border-subtle py-base">
                  <div>
                    <p className="font-zh text-body text-text-primary">重置进度</p>
                    <p className="mt-micro font-zh text-caption text-text-muted">
                      清空已抽记录，重新洗牌
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={requestReset}
                    className={`rounded-full border px-base py-tight font-zh text-caption transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-ring active:scale-[0.97] ${
                      resetArmed
                        ? 'border-brand-primary bg-brand-primary text-text-primary-dark'
                        : 'border-border-strong text-text-muted hover:border-brand-primary/40 hover:text-brand-primary'
                    }`}
                  >
                    {resetArmed ? '再点一次确认' : '重置'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
