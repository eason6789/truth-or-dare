import { create } from '../core/zustand-wrapper';
import { getInitialHistory, getQuestions } from '../utils/questions';

export interface HistoryEntry {
  id: number;
  text: string;
}

interface HistoryState {
  /** Drawn cards, most recently drawn first. */
  entries: HistoryEntry[];
  expandedId: number | null;
  toggleExpand: (id: number) => void;
  close: () => void;
}

const buildEntries = (): HistoryEntry[] => {
  const questions = getQuestions();
  const byId = new Map(questions.map((q) => [q.id, q.text]));
  return getInitialHistory()
    .filter((id) => byId.has(id))
    .map((id) => ({ id, text: byId.get(id) as string }))
    .reverse();
};

export const useHistoryStore = create<HistoryState>((set) => ({
  entries: buildEntries(),
  expandedId: null,

  toggleExpand: (id) =>
    set((state) => ({
      ...state,
      expandedId: state.expandedId === id ? null : id,
    })),

  close: () => {
    if (typeof window !== 'undefined') {
      window.App.transitionTo('table');
    }
  },
}));
