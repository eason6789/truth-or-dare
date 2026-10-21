import { create } from 'zustand';

/** 卡面单道题:替换词 s/se 可选,缺失时该面不渲染替换词区块 */
export interface CardFaceData {
  q: string;
  qe: string;
  s?: string;
  se?: string;
}

/** 一张签 = 正反两道不同的题(front=白面题, back=红面题) */
export interface Stick {
  front: CardFaceData;
  back: CardFaceData;
}

export type Screen = 'bucket' | 'card';
export type DrawPhase = 'idle' | 'shaking' | 'revealing' | 'revealed' | 'returning';

interface InlineStore {
  sticks?: Stick[];
  cards?: unknown[];
}

const resolveSticks = (): Stick[] => {
  const inline =
    typeof window !== 'undefined'
      ? ((window as unknown as { __INLINE_DATA__?: { store?: InlineStore } })
          .__INLINE_DATA__?.store ?? {})
      : {};
  const fromInline = Array.isArray(inline.sticks) ? inline.sticks : [];
  if (fromInline.length > 0) return fromInline;
  const fromApp =
    typeof window !== 'undefined' && Array.isArray(window.App?.store?.sticks)
      ? (window.App.store.sticks as Stick[])
      : [];
  if (fromApp.length > 0) return fromApp;
  // Synchronous fallback so the store is always renderable without effects.
  return [
    {
      front: { q: '你喜欢自己的原生家庭吗？为什么？', qe: 'Do you like your family of origin? Why?' },
      back: {
        q: '你是否相信命中注定？',
        qe: 'Do you believe in destiny?',
        s: '努力一定有结果、出身决定命运、一见钟情、有情人必终成眷属',
        se: 'effort always yields results, birth determines fate, love at first sight, true lovers will end up together',
      },
    },
  ];
};

const STICK_POOL = resolveSticks();

const pickIndex = (recent: number[]): number => {
  if (STICK_POOL.length <= 1) return 0;
  let idx = Math.floor(Math.random() * STICK_POOL.length);
  let guard = 0;
  while (recent.includes(idx) && guard < 24) {
    idx = Math.floor(Math.random() * STICK_POOL.length);
    guard += 1;
  }
  return idx;
};

interface HomeState {
  sticks: Stick[];
  screen: Screen;
  drawPhase: DrawPhase;
  stickIndex: number;
  flipped: boolean;
  recent: number[];
  /** 已抽次数,用于界面小计 */
  drawCount: number;
  shakeBucket: () => void;
  draw: () => void;
  reveal: () => void;
  flip: () => void;
  beginReturn: () => void;
  finishReturn: () => void;
}

export const useHomeStore = create<HomeState>((set, get) => ({
  sticks: STICK_POOL,
  screen: 'bucket',
  drawPhase: 'idle',
  stickIndex: 0,
  flipped: false,
  recent: [],
  drawCount: 0,

  shakeBucket: () => {
    const { drawPhase, screen } = get();
    if (screen !== 'bucket' || drawPhase !== 'idle') return;
    set({ drawPhase: 'shaking' });
    window.setTimeout(() => {
      const s = get();
      if (s.drawPhase === 'shaking') set({ drawPhase: 'idle' });
    }, 480);
  },

  draw: () => {
    const { drawPhase, screen, recent, drawCount } = get();
    if (screen !== 'bucket' || drawPhase === 'revealing' || drawPhase === 'revealed') return;
    const idx = pickIndex(recent);
    // 抽新签时先复位翻面状态,保证新签始终从正面(白面)展示
    set({
      drawPhase: 'revealing',
      stickIndex: idx,
      flipped: false,
      drawCount: drawCount + 1,
      recent: [...recent, idx].slice(-6),
    });
  },

  reveal: () => {
    const { drawPhase } = get();
    if (drawPhase !== 'revealing') return;
    set({ drawPhase: 'revealed', screen: 'card' });
  },

  flip: () => {
    const { drawPhase, screen } = get();
    if (screen !== 'card' || drawPhase !== 'revealed') return;
    set((state) => ({ flipped: !state.flipped }));
  },

  beginReturn: () => {
    const { drawPhase, screen } = get();
    if (screen !== 'card' || drawPhase !== 'revealed') return;
    set({ drawPhase: 'returning', flipped: false });
  },

  finishReturn: () => {
    const { drawPhase } = get();
    if (drawPhase !== 'returning') return;
    set({ drawPhase: 'idle', screen: 'bucket', flipped: false });
  },
}));
