import { useState } from 'react';

/**
 * 签桶场景:白色圆柱签桶 + 从桶口扇形伸出的红色签条。
 * 纯展示组件,通过 props 接收状态与回调,不持有应用状态。
 *
 * 设计坐标系(viewBox 0 0 240 360):
 *  - 签条围绕一个共同铰点 PIVOT(120, 116)旋转,底端正好探进桶口,
 *    任何角度下都不会出现"悬浮断头"。
 *  - 桶口椭圆中心 (120, 132),半径 rx 70 / ry 15,所有签条底端被桶口盖住。
 *  - 签条用二次贝塞尔微弯(手绘感),顶端圆角 rx=9。
 */

export interface StripSpec {
  /** 绕铰点的旋转角(度),负 = 向左倾 */
  angle: number;
  /** 签条露出桶口的长度(px,沿自身轴向) */
  len: number;
  /** 待机漂浮动画延迟(ms),0 表示关闭 */
  breatheDelay: number;
}

export const BUCKET_STRIPS: StripSpec[] = [
  { angle: -58, len: 108, breatheDelay: 0 },
  { angle: -42, len: 138, breatheDelay: 420 },
  { angle: -27, len: 116, breatheDelay: 900 },
  { angle: -13, len: 150, breatheDelay: 220 },
  { angle: 0, len: 126, breatheDelay: 640 },
  { angle: 13, len: 148, breatheDelay: 1080 },
  { angle: 27, len: 114, breatheDelay: 60 },
  { angle: 42, len: 136, breatheDelay: 760 },
  { angle: 58, len: 106, breatheDelay: 340 },
];

const PIVOT_X = 120;
const PIVOT_Y = 116;
const STRIP_W = 24;
/** 签条底端探进桶口的深度(被桶体盖住的部分) */
const STRIP_IN = 52;

function stripPath(len: number): string {
  const top = PIVOT_Y - len;
  const bottom = PIVOT_Y + STRIP_IN;
  const half = STRIP_W / 2;
  const r = 9;
  // 手绘微弯:左右边中点各向内/外错 3px
  return [
    `M ${PIVOT_X - half} ${top + r}`,
    `Q ${PIVOT_X - half} ${top} ${PIVOT_X - half + r} ${top}`,
    `L ${PIVOT_X + half - r} ${top}`,
    `Q ${PIVOT_X + half} ${top} ${PIVOT_X + half} ${top + r}`,
    `Q ${PIVOT_X + half - 3} ${(top + bottom) / 2} ${PIVOT_X + half} ${bottom}`,
    `L ${PIVOT_X - half} ${bottom}`,
    `Q ${PIVOT_X - half + 3} ${(top + bottom) / 2} ${PIVOT_X - half} ${top + r}`,
    'Z',
  ].join(' ');
}

function StripShape({ highlight = false }: { highlight?: boolean }) {
  return (
    <>
      <rect
        x={-STRIP_W / 2 + 4}
        y={-14}
        width={STRIP_W - 8}
        height={7}
        rx={3.5}
        style={{
          fill: highlight ? 'hsl(var(--color-text-inverse))' : 'hsl(var(--color-text-inverse) / 0.88)',
        }}
      />
      <path
        d={`M ${-STRIP_W / 2 + 5} 6 Q 0 12 ${STRIP_W / 2 - 5} 6`}
        fill="none"
        strokeWidth={2.4}
        strokeLinecap="round"
        style={{ stroke: 'hsl(var(--color-text-inverse) / 0.75)' }}
      />
    </>
  );
}

interface BucketSceneProps {
  /** 待机漂浮(仅闲置状态开启) */
  breathing: boolean;
  /** 摇晃反馈(空抽提示) */
  shaking: boolean;
  /** 抽签进行中:签条整体散开 + 高亮一根即将被抽走的签 */
  drawing: boolean;
  className?: string;
}

export function BucketScene({ breathing, shaking, drawing, className }: BucketSceneProps) {
  const [pressed, setPressed] = useState(false);
  const highlightIndex = 4;

  return (
    <svg
      viewBox="0 0 240 360"
      role="img"
      aria-label="插满签条的白色签桶"
      className={`${className ?? ''} ${shaking ? 'anim-bucket-shake' : ''}`}
      style={{
        overflow: 'visible',
        transformOrigin: '50% 82%',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 180ms var(--ease-spring-out)',
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {/* 地面投影 */}
      <ellipse
        cx={120}
        cy={334}
        rx={88}
        ry={13}
        style={{ fill: 'hsl(var(--color-text-primary) / 0.10)' }}
      />
      <ellipse
        cx={120}
        cy={332}
        rx={64}
        ry={9}
        style={{ fill: 'hsl(var(--color-text-primary) / 0.07)' }}
      />

      {/* 签条层(在桶体之后,底端被桶口遮住) */}
      <g>
        {BUCKET_STRIPS.map((strip, i) => {
          const isHighlighted = drawing && i === highlightIndex;
          const spread = drawing ? strip.angle * 0.22 : 0;
          const lift = isHighlighted ? -30 : 0;
          const scale = isHighlighted ? 1.06 : 1;
          return (
            <g
              key={strip.angle}
              transform={`rotate(${strip.angle} ${PIVOT_X} ${PIVOT_Y})`}
              style={{
                transformBox: 'view-box',
                transformOrigin: `${PIVOT_X}px ${PIVOT_Y}px`,
                transform: `rotate(${strip.angle + spread}deg) translateY(${lift}px) scale(${scale})`,
                transition: `transform var(--duration-draw) var(--ease-spring-out)`,
              }}
            >
              <g
                className={breathing && !drawing ? 'anim-strip-breathe' : ''}
                style={{ animationDelay: `${strip.breatheDelay}ms` }}
              >
                <path
                  d={stripPath(strip.len)}
                  strokeWidth={1.5}
                  style={{
                    fill: 'hsl(var(--color-brand-primary))',
                    stroke: 'hsl(var(--color-surface-doodle-dark))',
                    opacity: drawing && !isHighlighted ? 0.45 : 1,
                    transition: 'opacity var(--duration-fade) var(--ease-fade)',
                  }}
                />
                <g
                  transform={`translate(${PIVOT_X} ${PIVOT_Y - strip.len + 34}) rotate(${
                    strip.angle > 0 ? -4 : 4
                  })`}
                >
                  <StripShape highlight={isHighlighted} />
                </g>
              </g>
            </g>
          );
        })}
      </g>

      {/* 桶体:白色圆柱,手绘感描边 */}
      <g>
        {/* 桶身 */}
        <path
          d={[
            `M 50 132`,
            `L 55 300`,
            `Q 56 322 78 326`,
            `Q 120 333 162 326`,
            `Q 184 322 185 300`,
            `L 190 132`,
          ].join(' ')}
          strokeWidth={2}
          style={{
            fill: 'hsl(var(--color-text-inverse))',
            stroke: 'hsl(var(--color-surface-doodle-light))',
          }}
        />
        {/* 桶身两条手绘箍线 */}
        <path
          d="M 52.5 196 Q 120 208 187.5 196"
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          style={{ stroke: 'hsl(var(--color-surface-doodle-light))' }}
        />
        <path
          d="M 54.5 246 Q 120 258 185.5 246"
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          style={{ stroke: 'hsl(var(--color-surface-doodle-light))' }}
        />
        {/* 桶身中央小爱心涂鸦 */}
        <path
          d="M120 232 c-3.2-4.4-10.4-2.6-10.4 2.6 0 4.6 6.4 8.6 10.4 11.8 4-3.2 10.4-7.2 10.4-11.8 0-5.2-7.2-7-10.4-2.6z"
          fill="none"
          strokeWidth={2.2}
          strokeLinejoin="round"
          style={{ stroke: 'hsl(var(--color-brand-primary) / 0.55)' }}
        />
        {/* 桶口外沿(盖住签条底端) */}
        <ellipse
          cx={120}
          cy={132}
          rx={70}
          ry={15}
          strokeWidth={2}
          style={{
            fill: 'hsl(var(--color-text-inverse))',
            stroke: 'hsl(var(--color-surface-doodle-light))',
          }}
        />
        {/* 桶口内沿(深色,暗示桶的深度) */}
        <ellipse
          cx={120}
          cy={132}
          rx={56}
          ry={10.5}
          style={{ fill: 'hsl(var(--color-surface-doodle-light) / 0.65)' }}
        />
        {/* 桶口内再压一圈签条根部颜色,让签条"插进桶里" */}
        <ellipse
          cx={120}
          cy={133}
          rx={44}
          ry={8}
          style={{ fill: 'hsl(var(--color-surface-doodle-dark) / 0.35)' }}
        />
        {/* 桶口高光 */}
        <path
          d="M 56 128 Q 78 120 104 119.5"
          fill="none"
          strokeWidth={2.4}
          strokeLinecap="round"
          style={{ stroke: 'hsl(var(--color-text-inverse))' }}
        />
      </g>
    </svg>
  );
}
