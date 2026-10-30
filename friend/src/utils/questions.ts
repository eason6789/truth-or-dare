export interface Question {
  id: number;
  text: string;
}

interface StoreShape {
  questions?: Question[];
  history?: number[];
}

const readStore = (): StoreShape => {
  if (typeof window !== 'undefined' && window.App?.store) {
    return window.App.store as StoreShape;
  }
  return {};
};

/** All 52 question cards, verbatim from store.json. */
export const getQuestions = (): Question[] => {
  const list = readStore().questions;
  return Array.isArray(list) ? list : [];
};

export const getQuestionById = (id: number): Question | undefined =>
  getQuestions().find((q) => q.id === id);

/** Preview history ids shipped in store.json (first launch looks like a session in progress). */
export const getInitialHistory = (): number[] => {
  const list = readStore().history;
  return Array.isArray(list) ? list.filter((n) => typeof n === 'number') : [];
};

/** Format a question id as the card number mark, e.g. 7 -> "07". */
export const formatCardNo = (id: number): string =>
  String(id).padStart(2, '0');

/** One-line summary for the history list (plain truncation, no copy rewriting). */
export const summarize = (text: string, max = 34): string =>
  text.length > max ? `${text.slice(0, max)}…` : text;
