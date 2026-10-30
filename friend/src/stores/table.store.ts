import { create } from '../core/zustand-wrapper';
import {
  getInitialHistory,
  getQuestions,
  loadQuestions as loadQuestionsFromDb,
} from '../utils/questions';

export type TablePhase = 'idle' | 'drawing' | 'skipping' | 'complete';

interface TableState {
  /** Undrawn card ids, shuffled; index 0 is the top of the pile. */
  deck: number[];
  /** Drawn card ids, oldest first. */
  drawnIds: number[];
  /** Card currently lifted above the pile (settled once, waiting for next draw). */
  activeId: number | null;
  /** Card currently animating (draw settle or skip fly-out). */
  outgoingId: number | null;
  phase: TablePhase;
  soundOn: boolean;
  settingsOpen: boolean;
  resetArmed: boolean;
  /** Bumped to remount the draggable card (snap back after a cancelled drag). */
  dragResetKey: number;

  beginDraw: () => void;
  settleDraw: () => void;
  beginSkip: () => void;
  settleSkip: () => void;
  cancelGesture: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSound: () => void;
  requestReset: () => void;
  /** 从后端拉取题库并重建牌堆（运行时替换内置题目）。 */
  loadQuestions: () => Promise<void>;
}

const shuffle = (ids: number[]): number[] => {
  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const buildInitialDeck = (): { deck: number[]; drawnIds: number[] } => {
  const allIds = getQuestions().map((q) => q.id);
  const drawn = getInitialHistory().filter((id) => allIds.includes(id));
  const drawnSet = new Set(drawn);
  return { deck: shuffle(allIds.filter((id) => !drawnSet.has(id))), drawnIds: drawn };
};

const initial = buildInitialDeck();

export const useTableStore = create<TableState>((set, get) => ({
  deck: initial.deck,
  drawnIds: initial.drawnIds,
  activeId: null,
  outgoingId: null,
  phase: initial.deck.length === 0 ? 'complete' : 'idle',
  soundOn: true,
  settingsOpen: false,
  resetArmed: false,
  dragResetKey: 0,

  beginDraw: () =>
    set((state) => {
      if (state.phase !== 'idle' || state.deck.length === 0) return state;
      const [next, ...rest] = state.deck;
      return {
        ...state,
        deck: rest,
        outgoingId: next,
        phase: 'drawing',
      };
    }),

  settleDraw: () =>
    set((state) => {
      if (state.phase !== 'drawing' || state.outgoingId === null) return state;
      const landed = state.outgoingId;
      const drawnIds = state.drawnIds.includes(landed)
        ? state.drawnIds
        : [...state.drawnIds, landed];
      return {
        ...state,
        activeId: landed,
        outgoingId: null,
        drawnIds,
        phase: state.deck.length === 0 ? 'complete' : 'idle',
      };
    }),

  beginSkip: () =>
    set((state) => {
      if (state.phase !== 'idle' || state.activeId === null) return state;
      return { ...state, outgoingId: state.activeId, activeId: null, phase: 'skipping' };
    }),

  settleSkip: () =>
    set((state) => {
      if (state.phase !== 'skipping' || state.outgoingId === null) return state;
      // Skipped card goes to the bottom of the pile — it will resurface later.
      return {
        ...state,
        deck: [...state.deck, state.outgoingId],
        outgoingId: null,
        phase: 'idle',
      };
    }),

  cancelGesture: () =>
    set((state) =>
      state.phase === 'idle'
        ? { ...state, dragResetKey: state.dragResetKey + 1 }
        : state
    ),

  openSettings: () => set((state) => ({ ...state, settingsOpen: true, resetArmed: false })),
  closeSettings: () =>
    set((state) => ({ ...state, settingsOpen: false, resetArmed: false })),
  toggleSound: () => set((state) => ({ ...state, soundOn: !state.soundOn })),

  requestReset: () => {
    const state = get();
    if (!state.resetArmed) {
      set({ ...state, resetArmed: true });
      return;
    }
    const allIds = getQuestions().map((q) => q.id);
    set({
      ...state,
      deck: shuffle(allIds),
      drawnIds: [],
      activeId: null,
      outgoingId: null,
      phase: 'idle',
      resetArmed: false,
      settingsOpen: false,
      dragResetKey: state.dragResetKey + 1,
    });
  },

  loadQuestions: async () => {
    const questions = await loadQuestionsFromDb();
    const allIds = questions.map((q) => q.id);
    set((state) => {
      const drawn = state.drawnIds.filter((id) => allIds.includes(id));
      const drawnSet = new Set(drawn);
      const deck = shuffle(allIds.filter((id) => !drawnSet.has(id)));
      return {
        ...state,
        deck,
        drawnIds: drawn,
        phase: deck.length === 0 ? 'complete' : 'idle',
      };
    });
  },
}));
