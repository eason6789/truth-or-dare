import { useState } from 'react';

/**
 * 签桶场景:白色圆柱签桶 + 从桶口扇形伸出的签条。
 * 纯展示组件,通过 props 接收状态与回调,不持有应用状态。
 *
 * 设计坐标系(viewBox 0 0 240 380):
 *  - 穿插关系(图层自底向上):地面投影 → 桶后沿内壁 → 签条(根部伸入桶口)
 *    → 桶前壁(盖住签条根部) → 前沿描边。签条视觉上从桶口内部"长出来"。
 *  - 桶口用椭圆表现开口透视:后沿弧在签条后,前壁压住签条根部。
 *  - 签条围绕铰点 PIVOT(120, 122)旋转,底端探入桶内 84px,
 *    任何角度下根部都被前壁遮住,无悬浮断头。
 *  - 签条露出部分是白面卡顶:奶油白卡面 + 朱红圆角顶端(与实体卡一致),
 *    而不是整根红签。
 */

export interface StripSpec {
  /** 绕铰点的旋转角(度),负 = 向左倾 */
  angle: number;
  /** 签条露出桶口的长度(px,沿自身轴向) */
  len: number;
  /** 待机漂浮动画延迟(ms),0 表示关闭 */
  breatheDelay: number;
}

/** 扇形收敛至 ±28°,高低错落,根部全部没入桶口 */
export const BUCKET_STRIPS: StripSpec[] = [
  { angle: -28, len: 96, breatheDelay: 0 },
  { angle: -20, len: 124, breatheDelay: 420 },
  { angle: -12, len: 104, breatheDelay: 900 },
  { angle: -5, len: 132, breatheDelay: 220 },
  { angle: 2, len: 112, breatheDelay: 640 },
  { angle: 9, len: 130, breatheDelay: 1080 },
  { angle: 16, len: 102, breatheDelay: 60 },
  { angle: 23, len: 120, breatheDelay: 760 },
  { angle: 28, len: 94, breatheDelay: 340 },
];

const PIVOT_X = 120;
const PIVOT_Y = 122;
const STRIP_W = 24;
/** 签条底端探进桶内的深度(被桶前壁盖住的部分) */
const STRIP_IN = 84;

/* 桶口 / 桶身几何(敦实比例:口径 150,身高约 196) */
const RIM_CY = 122;
const RIM_RX = 75;
const RIM_RY = 14;
const RIM_TOP = RIM_CY - RIM_RY; // 108

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

/** 签条白面卡顶上的红色小涂鸦(爱心 + 弧线,呼应实体卡背面图案) */
function StripTopMark({ highlight = false }: { highlight?: boolean }) {
  return (
    <g
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        stroke: highlight
          ? 'hsl(var(--color-brand-primary))'
          : 'hsl(var(--color-brand-primary) / 0.85)',
      }}
    >
      <path
        d="M0 4.2c-2.1-1.5-3.6-3-3.6-4.8 0-1.4 1-2.4 2.3-2.4.6 0 1.1.3 1.3.8.2-.5.7-.8 1.3-.8 1.3 0 2.3 1 2.3 2.4 0 1.8-1.5 3.3-3.6 4.8z"
        strokeWidth={1.5}
      />
      <path d="M -7 9.5 Q 0 13 7 9.5" strokeWidth={1.8} />
    </g>
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
      viewBox="0 0 240 380"
      role="img"
      aria-label="插满签条的白色签桶"
      className={`${className ?? ''} ${shaking ? 'anim-bucket-shake' : ''}`}
      style={{
        overflow: 'visible',
        transformOrigin: '50% 86%',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 180ms var(--ease-spring-out)',
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {/* 地面投影(柔和落地) */}
      <ellipse
        cx={120}
        cy={356}
        rx={90}
        ry={13}
        style={{ fill: 'hsl(var(--color-text-primary) / 0.10)' }}
      />
      <ellipse
        cx={120}
        cy={354}
        rx={62}
        ry={8.5}
        style={{ fill: 'hsl(var(--color-text-primary) / 0.08)' }}
      />

      {/* 桶后沿内壁:桶口椭圆的上半弧(在签条后面,暗示桶口深度) */}
      <path
        d={`M ${120 - RIM_RX} ${RIM_CY} A ${RIM_RX} ${RIM_RY} 0 0 1 ${120 + RIM_RX} ${RIM_CY}`}
        fill="none"
        strokeWidth={2}
        style={{ stroke: 'hsl(var(--color-surface-doodle-light))' }}
      />
      <path
        d={`M ${120 - RIM_RX + 6} ${RIM_CY} A ${RIM_RX - 6} ${RIM_RY - 3.5} 0 0 1 ${120 + RIM_RX - 6} ${RIM_CY}`}
        fill="none"
        strokeWidth={1.5}
        style={{ stroke: 'hsl(var(--color-surface-doodle-light) / 0.55)' }}
      />

      {/* 签条层:根部伸入桶口,之后被桶前壁遮住 */}
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
                {/* 白面卡身(露出桶口的部分是奶油白卡面) */}
                <path
                  d={stripPath(strip.len)}
                  strokeWidth={1.5}
                  style={{
                    fill: 'hsl(var(--color-surface-front))',
                    stroke: 'hsl(var(--color-surface-doodle-light))',
                    opacity: drawing && !isHighlighted ? 0.5 : 1,
                    transition: 'opacity var(--duration-fade) var(--ease-fade)',
                  }}
                />
                {/* 红色圆角卡顶(实体卡的红色顶端) */}
                <rect
                  x={PIVOT_X - STRIP_W / 2 + 3.5}
                  y={PIVOT_Y - strip.len + 3.5}
                  width={STRIP_W - 7}
                  height={17}
                  rx={6}
                  style={{
                    fill: isHighlighted
                      ? 'hsl(var(--color-brand-primary))'
                      : 'hsl(var(--color-brand-primary) / 0.92)',
                    opacity: drawing && !isHighlighted ? 0.5 : 1,
                    transition: 'opacity var(--duration-fade) var(--ease-fade)',
                  }}
                />
                <g transform={`translate(${PIVOT_X} ${PIVOT_Y - strip.len + 42})`}>
                  <StripTopMark highlight={isHighlighted} />
                </g>
              </g>
            </g>
          );
        })}
      </g>

      {/* 桶前壁:盖住签条根部,签条从桶口内部"长出来" */}
      <g>
        <path
          d={[
            `M ${120 - RIM_RX} ${RIM_CY}`,
            `A ${RIM_RX} ${RIM_RY} 0 0 0 ${120 + RIM_RX} ${RIM_CY}`,
            `L 188 320`,
            `Q 187 342 165 347`,
            `Q 120 355 75 347`,
            `Q 53 342 52 320`,
            'Z',
          ].join(' ')}
          strokeWidth={2}
          style={{
            fill: 'hsl(var(--color-text-inverse))',
            stroke: 'hsl(var(--color-surface-doodle-light))',
          }}
        />
        {/* 左侧高光(白色柱体的圆柱体感) */}
        <path
          d="M 63 142 Q 60 230 66 312"
          fill="none"
          strokeWidth={6}
          strokeLinecap="round"
          style={{ stroke: 'hsl(var(--color-surface-front) / 0.9)' }}
        />
        <path
          d="M 72 148 Q 69.5 228 74 306"
          fill="none"
          strokeWidth={2.2}
          strokeLinecap="round"
          style={{ stroke: 'hsl(var(--color-surface-front) / 0.65)' }}
        />
        {/* 桶身两条手绘箍线 */}
        <path
          d="M 51.5 208 Q 120 220 188.5 208"
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          style={{ stroke: 'hsl(var(--color-surface-doodle-light))' }}
        />
        <path
          d="M 53.5 262 Q 120 274 186.5 262"
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          style={{ stroke: 'hsl(var(--color-surface-doodle-light))' }}
        />
        {/* 桶身中央小爱心涂鸦 */}
        <path
          d="M120 236 c-3.2-4.4-10.4-2.6-10.4 2.6 0 4.6 6.4 8.6 10.4 11.8 4-3.2 10.4-7.2 10.4-11.8 0-5.2-7.2-7-10.4-2.6z"
          fill="none"
          strokeWidth={2.2}
          strokeLinejoin="round"
          style={{ stroke: 'hsl(var(--color-brand-primary) / 0.55)' }}
        />
        {/* 桶口前沿描边(强化开口透视,压在签条根部之上) */}
        <path
          d={`M ${120 - RIM_RX} ${RIM_CY} A ${RIM_RX} ${RIM_RY} 0 0 0 ${120 + RIM_RX} ${RIM_CY}`}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          style={{ stroke: 'hsl(var(--color-surface-doodle-light))' }}
        />
        {/* 桶口左上高光 */}
        <path
          d={`M ${120 - RIM_RX + 9} ${RIM_TOP + 3} Q 92 ${RIM_TOP - 2} 70 ${RIM_TOP + 1.5}`}
          fill="none"
          strokeWidth={2.2}
          strokeLinecap="round"
          style={{ stroke: 'hsl(var(--color-surface-doodle-light) / 0.8)' }}
        />
      </g>
    </svg>
  );
}
