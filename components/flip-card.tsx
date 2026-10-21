import type { CSSProperties } from 'react';

/**
 * 真心话大冒险卡牌(3D 翻面)。
 * 纯展示组件:正面米白 / 背面朱红,正反两面是同一张签上的两道不同题目,
 * 手绘涂鸦散布下半部。翻面由外层 wrapper(perspective)+ 内层 flipper(preserve-3d + rotateY)实现。
 */

export interface CardFaceData {
  q: string;
  qe: string;
  /** 替换词(可选):部分题目没有替换词,该字段缺失时不渲染替换词区块 */
  s?: string;
  se?: string;
}

export interface FlipCardData {
  front: CardFaceData;
  back: CardFaceData;
}

interface FlipCardProps {
  card: FlipCardData;
  flipped: boolean;
  onFlip: () => void;
  className?: string;
  style?: CSSProperties;
}

/* ---------- 手绘涂鸦(统一 24 viewBox,stroke 继承 currentColor) ---------- */

const DOODLE_PATHS = {
  heart: 'M12 20.2c-4.6-3.1-8-6.3-8-10.1 0-2.9 2.2-5.1 5-5.1 1.3 0 2.5.6 3 1.6.5-1 1.7-1.6 3-1.6 2.8 0 5 2.2 5 5.1 0 3.8-3.4 7-8 10.1z',
  envelope: 'M4 7.5Q4 6 5.5 6h13Q20 6 20 7.5v9q0 1.5-1.5 1.5h-13Q4 18 4 16.5z M4.5 7l7.5 5.5L19.5 7',
  bird: 'M4 15c3-1 5-3.5 5.5-7 .2-1.4 1.4-2.4 2.8-2.2 1.1.2 1.9 1.1 2 2.2l3.5-.8-2.4 2.6c.5 3.8-2 7.2-5.8 7.7-2 .3-4-.3-5.6-2.5z M13.8 8.4h.01',
  ring: 'M12 15.2a4.6 4.6 0 1 0 0-9.2 4.6 4.6 0 0 0 0 9.2z M9.2 8.6L12 4l2.8 4.6 M10.8 4h2.4',
  arrowHeart:
    'M4 18c4.5-2 8.5-5.5 11-10.5 M15 5l2.2-1.6L18 6 M12 20.2c-2.5-1.7-4.3-3.4-4.3-5.4 0-1.6 1.2-2.7 2.7-2.7.7 0 1.3.3 1.6.9.3-.6.9-.9 1.6-.9 1.5 0 2.7 1.1 2.7 2.7 0 2-1.8 3.7-4.3 5.4z',
  star: 'M12 4.5l2.1 4.6 5 .5-3.7 3.4 1 4.9-4.4-2.5-4.4 2.5 1-4.9L4.9 9.6l5-.5z',
  flower: 'M12 12.5m-1.8 0a1.8 1.8 0 1 0 3.6 0 1.8 1.8 0 1 0-3.6 0 M12 5.5c1.6 1.8 1.6 3.6 0 5-1.6-1.4-1.6-3.2 0-5z M18.5 12c-1.8 1.6-3.6 1.6-5 0 1.4-1.6 3.2-1.6 5 0z M12 18.5c-1.6-1.8-1.6-3.6 0-5 1.6 1.4 1.6 3.2 0 5z M5.5 12c1.8-1.6 3.6-1.6 5 0-1.4 1.6-3.2 1.6-5 0z',
  sprout: 'M12 20v-7 M12 13c0-3 2.2-5 5.5-5 0 3.2-2.3 5-5.5 5z M12 13c0-3-2.2-5-5.5-5 0 3.2 2.3 5 5.5 5z',
  gift: 'M5 10.5h14V20H5z M4 7.5h16v3H4z M12 7.5V20 M12 7.5c-2.6.2-4.4-.8-4.4-2.3 0-1.1 1-1.9 2-1.7 1.3.3 2 1.9 2.4 4z M12 7.5c2.6.2 4.4-.8 4.4-2.3 0-1.1-1-1.9-2-1.7-1.3.3-2 1.9-2.4 4z',
  dice: 'M5 5h14v14H5z M9 9h.01 M15 9h.01 M12 12h.01 M9 15h.01 M15 15h.01',
  crown: 'M5 16.5L4 8.5l4.5 3L12 5.5l3.5 6 4.5-3-1 8z M5 19h14',
  balloon: 'M12 13.5c-3.3 0-5.5-2.5-5.5-5.7C6.5 4.9 8.9 3 12 3s5.5 1.9 5.5 4.8c0 3.2-2.2 5.7-5.5 5.7z M12 13.5l-.9 2h1.8l-.9-2z M12 15.5c-1 1.8-1 3.2 0 5.5',
};

type DoodleName = keyof typeof DOODLE_PATHS;

function Doodle({
  name,
  size,
  style,
}: {
  name: DoodleName;
  size: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <path d={DOODLE_PATHS[name]} />
    </svg>
  );
}

/** 卡牌下半部的散落涂鸦布局(位置为容器内百分比) */
const DOODLE_LAYOUT: Array<{ name: DoodleName; x: number; y: number; size: number; rot: number; op: number }> = [
  { name: 'heart', x: 8, y: 6, size: 26, rot: -14, op: 0.9 },
  { name: 'envelope', x: 66, y: 2, size: 24, rot: 10, op: 0.75 },
  { name: 'bird', x: 34, y: 16, size: 30, rot: -6, op: 0.85 },
  { name: 'ring', x: 76, y: 26, size: 24, rot: 16, op: 0.7 },
  { name: 'arrowHeart', x: 6, y: 34, size: 28, rot: -10, op: 0.8 },
  { name: 'star', x: 48, y: 38, size: 20, rot: 12, op: 0.65 },
  { name: 'flower', x: 26, y: 52, size: 24, rot: 8, op: 0.75 },
  { name: 'sprout', x: 70, y: 56, size: 26, rot: -12, op: 0.8 },
  { name: 'gift', x: 10, y: 68, size: 24, rot: 6, op: 0.7 },
  { name: 'dice', x: 46, y: 72, size: 26, rot: -8, op: 0.85 },
  { name: 'crown', x: 74, y: 82, size: 26, rot: 10, op: 0.7 },
  { name: 'balloon', x: 20, y: 86, size: 24, rot: -6, op: 0.65 },
];

/* ---------- 品牌手形 Logo(挥手打招呼) ---------- */

function HandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8.5 12.5V6.8a1.3 1.3 0 0 1 2.6 0v4.4" />
      <path d="M11.1 11V5.3a1.3 1.3 0 0 1 2.6 0V11" />
      <path d="M13.7 11.4V6.6a1.3 1.3 0 0 1 2.6 0v6.1" />
      <path d="M8.5 10.5c-1.6-1.7-3.4-.9-3 1 .5 2.4 2.1 5.2 4 6.6 1.6 1.2 3.4 1.6 5 .9 2-.9 3.1-2.8 3.1-5.3" />
      <path d="M18.6 4.5l.9-1.5 M20 7l1.6-.6" />
    </svg>
  );
}

/* ---------- 卡面(正/背共用布局,通过 inverse 切换配色) ---------- */

function CardFace({
  face,
  inverse,
  className,
  style,
}: {
  face: CardFaceData;
  inverse: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const ink = inverse ? '--color-text-inverse' : '--color-text-primary';
  const brand = inverse ? '--color-text-inverse' : '--color-brand-primary';
  const sub = inverse ? '--color-text-inverse' : '--color-text-secondary';
  const hsl = (name: string) => `hsl(var(${name}))`;
  const doodle = inverse
    ? 'hsl(var(--color-text-inverse) / 0.5)'
    : 'hsl(var(--color-brand-primary) / 0.45)';

  return (
    <div
      className={`absolute inset-0 flex flex-col overflow-hidden rounded-xl ${
        inverse ? 'bg-surface-back' : 'bg-surface-front'
      } ${className ?? ''}`}
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        ...style,
      }}
    >
      {/* 顶部:眉批 + 品牌 */}
      <div className="relative z-10 flex items-start justify-between px-base pt-snug">
        <div className="flex flex-col gap-micro">
          <span
            className="font-zh text-caption"
            style={{ color: `${hsl(brand)}`, opacity: inverse ? 0.85 : 1 }}
          >
            你这样看世界啊
          </span>
          <span
            className="h-[2px] w-8 rounded-full"
            style={{ background: `${hsl(brand)}`, opacity: 0.55 }}
          />
        </div>
        <div
          className="flex items-center gap-micro"
          style={{ color: `${hsl(brand)}` }}
        >
          <span className="font-zh text-body font-bold leading-none">孩子气</span>
          <HandMark />
        </div>
      </div>

      {/* 上引号 */}
      <div
        className="relative z-10 -mb-2 mt-1 px-base font-zh text-h1 font-extrabold leading-none"
        style={{ color: `${hsl(brand)}` }}
        aria-hidden="true"
      >
        “
      </div>

      {/* 主问题 */}
      <div className="relative z-10 px-base">
        <h2
          className="font-zh text-h3 font-extrabold"
          style={{
            color: `${hsl(ink)}`,
            lineHeight: 'var(--line-height-h3)',
            letterSpacing: 'var(--letter-spacing-h3)',
          }}
        >
          {face.q}
        </h2>
        <p
          className="mt-micro font-body text-caption"
          style={{
            color: `${hsl(sub)}`,
            opacity: inverse ? 0.75 : 1,
            lineHeight: 'var(--line-height-caption)',
            letterSpacing: 'var(--letter-spacing-caption)',
          }}
        >
          {face.qe}
        </p>
        <div
          className="mt-tight h-px w-full"
          style={{ background: `${hsl(brand)}`, opacity: inverse ? 0.6 : 0.35 }}
        />
      </div>

      {/* 替换词(可选:无 s/se 的题不渲染该区块) */}
      {face.s ? (
        <div className="relative z-10 px-base pt-tight">
          <p className="font-zh text-body font-bold" style={{ color: `${hsl(brand)}` }}>
            替换词：
          </p>
          <p
            className="mt-micro font-zh text-caption font-bold"
            style={{
              color: `${hsl(brand)}`,
              lineHeight: 'var(--line-height-caption)',
            }}
          >
            {face.s}
          </p>
          {face.se ? (
            <>
              <p
                className="mt-tight font-body text-caption italic"
                style={{ color: `${hsl(sub)}`, opacity: inverse ? 0.75 : 1 }}
              >
                Substitution:
              </p>
              <p
                className="mt-micro font-body text-caption"
                style={{
                  color: `${hsl(inverse ? '--color-text-inverse' : '--color-text-primary')}`,
                  opacity: inverse ? 0.9 : 0.85,
                  lineHeight: 'var(--line-height-caption)',
                  fontSize: '12px',
                }}
              >
                {face.se}
              </p>
            </>
          ) : null}
        </div>
      ) : null}

      {/* 下半部:散落涂鸦 + 下引号 */}
      <div className="relative z-0 min-h-0 flex-1" style={{ color: doodle }}>
        {DOODLE_LAYOUT.map((d, i) => (
          <Doodle
            key={`${d.name}-${i}`}
            name={d.name}
            size={d.size}
            style={{
              position: 'absolute',
              left: `${d.x}%`,
              top: `${d.y}%`,
              transform: `rotate(${d.rot}deg)`,
              opacity: d.op,
            }}
          />
        ))}
        <div
          className="absolute bottom-1 right-3 font-zh text-h1 font-extrabold leading-none"
          style={{ color: `${hsl(brand)}`, opacity: 0.9 }}
          aria-hidden="true"
        >
          ”
        </div>
      </div>

      {/* 底部小字(提示语由外层页面统一渲染为弱化小字) */}
      <div className="relative z-10 flex flex-col gap-tight px-base pb-tight">
        <div className="flex items-center justify-between">
          <span
            className="font-zh text-caption"
            style={{ color: `${hsl(brand)}`, opacity: 0.7, fontSize: '12px' }}
          >
            真心话 · 大冒险
          </span>
          <span
            className="font-body text-caption"
            style={{ color: `${hsl(sub)}`, opacity: 0.55, fontSize: '12px' }}
          >
            KIDULT
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- 3D 翻面卡牌 ---------- */

export function FlipCard({ card, flipped, onFlip, className, style }: FlipCardProps) {
  return (
    <div
      className={className}
      style={{ perspective: '1200px', ...style }}
    >
      <button
        type="button"
        onClick={onFlip}
        aria-label={flipped ? '卡牌背面,点击翻回正面' : '卡牌正面,点击翻面'}
        className="relative block h-full w-full cursor-pointer rounded-xl transition-transform duration-200 ease-out active:scale-[0.98]"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: `transform var(--duration-flip) var(--ease-flip)`,
          boxShadow: 'var(--shadow-card-hover)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <CardFace face={card.front} inverse={false} />
        <CardFace face={card.back} inverse style={{ transform: 'rotateY(180deg)' }} />
      </button>
    </div>
  );
}
