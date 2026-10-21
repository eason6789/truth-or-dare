import { useEffect, useMemo, useRef } from 'react';
import { BucketScene } from '@components/bucket-scene';
import { FlipCard } from '@components/flip-card';
import { useHomeStore } from '../stores/home.store';

/**
 * 孩子气·真心话大冒险 — 单页双状态 H5
 * 状态A(签桶):米白底 + 精简标题 + 签桶主角 + 提示小字 + 「点击抽签」胶囊按钮
 * 状态B(卡牌):深色纯底 + 3D 翻面卡牌(唯一主角)+ 弱化提示 + 「再抽一张」按钮
 *
 * 抽签时序:
 *   tap → draw(phase=revealing) → 480ms 后 reveal(切到卡牌屏,卡牌飞入)
 * 收回时序:
 *   tap → beginReturn(卡牌飞回) → 460ms 后 finishReturn(回到签桶屏)
 */

const REVEAL_DELAY_MS = 480;
const RETURN_MS = 460;

function Sparkle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
      <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </svg>
  );
}

export default function HomePage() {
  const screen = useHomeStore((s) => s.screen);
  const drawPhase = useHomeStore((s) => s.drawPhase);
  const stickIndex = useHomeStore((s) => s.stickIndex);
  const flipped = useHomeStore((s) => s.flipped);
  const drawCount = useHomeStore((s) => s.drawCount);
  const recent = useHomeStore((s) => s.recent);
  const draw = useHomeStore((s) => s.draw);
  const reveal = useHomeStore((s) => s.reveal);
  const flip = useHomeStore((s) => s.flip);
  const beginReturn = useHomeStore((s) => s.beginReturn);
  const finishReturn = useHomeStore((s) => s.finishReturn);
  const sticks = useHomeStore((s) => s.sticks);

  const timers = useRef<number[]>([]);
  useEffect(() => {
    const stash = timers.current;
    return () => stash.forEach((t) => window.clearTimeout(t));
  }, []);

  const handleDraw = () => {
    if (drawPhase !== 'idle') return;
    draw();
    timers.current.push(window.setTimeout(reveal, REVEAL_DELAY_MS));
  };

  const handleReturn = () => {
    if (drawPhase !== 'revealed') return;
    beginReturn();
    timers.current.push(window.setTimeout(finishReturn, RETURN_MS));
  };

  const stick = useMemo(() => sticks[stickIndex] ?? sticks[0], [sticks, stickIndex]);
  const inCardScreen = screen === 'card';
  const drawing = drawPhase === 'revealing';

  return (
    <div className="antialiased relative min-h-dvh w-full overflow-hidden font-zh">
      {/* ============ 状态A:签桶主界面 ============ */}
      <div
        aria-hidden={inCardScreen}
        className="absolute inset-0 z-10 flex flex-col bg-surface-front transition-opacity"
        style={{
          opacity: inCardScreen ? 0 : 1,
          pointerEvents: inCardScreen ? 'none' : 'auto',
          transitionDuration: 'var(--duration-fade)',
          transitionTimingFunction: 'var(--ease-fade)',
        }}
      >
        {/* 品牌标题(精简) */}
        <header
          className="flex flex-col items-center gap-micro px-comfortable"
          style={{ paddingTop: 'max(var(--spacing-stack-md), env(safe-area-inset-top, 0px))' }}
        >
          <h1
            className="text-center font-zh text-h3 font-extrabold text-brand-primary"
            style={{
              lineHeight: 'var(--line-height-h3)',
              letterSpacing: 'var(--letter-spacing-h3)',
            }}
          >
            孩子气 · 真心话大冒险
          </h1>
          <p className="font-zh text-caption text-text-secondary">抽一张,答一题</p>
        </header>

        {/* 签桶(绝对视觉主角) */}
        <main className="relative flex min-h-0 flex-1 items-center justify-center px-comfortable">
          <Sparkle
            className="absolute left-[14%] top-[12%] text-brand-primary opacity-40"
            style={{ width: 20, height: 20, transform: 'rotate(-12deg)' }}
          />
          <Sparkle
            className="absolute right-[16%] top-[22%] text-brand-primary opacity-30"
            style={{ width: 15, height: 15, transform: 'rotate(14deg)' }}
          />
          <button
            type="button"
            onClick={handleDraw}
            aria-label="点击签桶抽签"
            className="relative flex h-full max-h-[480px] w-full max-w-[320px] cursor-pointer items-center justify-center outline-none transition-transform duration-200 ease-out focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 active:scale-[0.98]"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <BucketScene
              breathing={drawPhase === 'idle'}
              shaking={drawing}
              drawing={drawing}
              className="h-full w-full"
            />
          </button>
        </main>

        {/* 底部操作区:提示小字 + 红色胶囊,与上方标题留白对称 */}
        <footer
          className="flex flex-col items-center gap-snug px-comfortable"
          style={{ paddingBottom: 'max(var(--spacing-stack-md), env(safe-area-inset-bottom, 0px))' }}
        >
          <p className="font-zh text-caption text-text-secondary" style={{ opacity: 0.75 }}>
            {drawCount > 0
              ? `已抽 ${drawCount} 签 · 最近 ${recent.length} 签不重复 · 共 ${sticks.length} 张签`
              : '点击签筒,抽出今日一签'}
          </p>
          <button
            type="button"
            onClick={handleDraw}
            disabled={drawing}
            className="flex items-center justify-center gap-tight rounded-full bg-brand-primary font-zh text-body-lg font-bold text-text-inverse transition-all duration-200 ease-out hover:-translate-y-[2px] focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.97] disabled:opacity-70"
            style={{
              padding: 'var(--spacing-snug) var(--spacing-loose)',
              boxShadow: 'var(--shadow-card-hover)',
            }}
          >
            {drawing ? '抽签中…' : '点击抽签'}
          </button>
        </footer>
      </div>

      {/* ============ 状态B:卡牌展示界面 ============ */}
      <div
        aria-hidden={!inCardScreen}
        className="absolute inset-0 z-20 flex flex-col transition-opacity"
        style={{
          background:
            'radial-gradient(120% 85% at 50% 0%, hsl(var(--color-brand-primary) / 0.16) 0%, hsl(var(--color-text-primary)) 58%)',
          opacity: inCardScreen ? 1 : 0,
          pointerEvents: inCardScreen ? 'auto' : 'none',
          transitionDuration: 'var(--duration-fade)',
          transitionTimingFunction: 'var(--ease-fade)',
        }}
      >
        <main
          className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-comfortable"
          style={{ paddingTop: 'max(var(--spacing-base), env(safe-area-inset-top, 0px))' }}
        >
          <FlipCard
            card={stick}
            flipped={flipped}
            onFlip={flip}
            className={
              drawPhase === 'revealing'
                ? 'anim-card-draw'
                : drawPhase === 'returning'
                  ? 'anim-card-return'
                  : ''
            }
            style={{
              width: 'min(75vw, 260px)',
              height: 'min(64dvh, 540px)',
            }}
          />
        </main>

        <footer
          className="flex flex-col items-center gap-snug px-comfortable"
          style={{ paddingBottom: 'max(var(--spacing-stack-md), env(safe-area-inset-bottom, 0px))' }}
        >
          {/* 弱化提示语(低对比小字,与当前卡面对应) */}
          <p
            className="font-zh text-caption text-text-inverse transition-opacity"
            style={{
              opacity: 0.45,
              transitionDuration: 'var(--duration-fade)',
            }}
          >
            {flipped ? '这题也不想？再抽一张吧' : '不想答这题？点击翻面'}
          </p>
          <button
            type="button"
            onClick={handleReturn}
            disabled={drawPhase === 'returning'}
            className="rounded-full border-2 border-brand-primary bg-surface-front font-zh text-body-lg font-bold text-brand-primary transition-all duration-200 ease-out hover:-translate-y-[2px] focus-visible:ring-2 focus-visible:ring-text-inverse focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.97] disabled:opacity-70"
            style={{
              padding: 'var(--spacing-snug) var(--spacing-loose)',
              boxShadow: 'var(--shadow-card-hover)',
            }}
          >
            再抽一张
          </button>
        </footer>
      </div>
    </div>
  );
}
