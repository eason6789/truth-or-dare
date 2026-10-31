export interface Question {
  id: number;
  text: string;
}

interface StoreShape {
  questions?: Question[];
  history?: number[];
}

/** Backend sticks for the friend edition: one question per card, stored in front.q. */
interface FriendStick {
  front?: { q?: string };
}

const readStore = (): StoreShape => {
  if (typeof window !== 'undefined' && window.App?.store) {
    return window.App.store as StoreShape;
  }
  return {};
};

/** Questions loaded from the backend at runtime; null until a fetch succeeds. */
let dbQuestions: Question[] | null = null;

/** localStorage key for the friend edition's drawn-card history. */
const DRAWN_KEY = 'truth-or-dare:friend:drawnIds';

const readDrawnFromStorage = (): number[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DRAWN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((n): n is number => typeof n === 'number')
      : null;
  } catch {
    return null;
  }
};

/** Persist drawn card ids so 往期牌堆 survives full-page navigation. */
export const saveDrawnIds = (ids: number[]): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DRAWN_KEY, JSON.stringify(ids));
  } catch {
    // 存储不可用时静默降级，游戏仍可用
  }
};

/** All question cards: DB-backed when loaded, otherwise the inline store.json questions. */
export const getQuestions = (): Question[] => {
  if (dbQuestions && dbQuestions.length > 0) return dbQuestions;
  const list = readStore().questions;
  return Array.isArray(list) ? list : [];
};

export const getQuestionById = (id: number): Question | undefined =>
  getQuestions().find((q) => q.id === id);

/** Drawn history ids: localStorage first (real progress), else store.json preview. */
export const getInitialHistory = (): number[] => {
  const fromStorage = readDrawnFromStorage();
  if (fromStorage !== null) return fromStorage;
  const list = readStore().history;
  return Array.isArray(list) ? list.filter((n) => typeof n === 'number') : [];
};

/**
 * 从后端拉取朋友版题库并缓存；失败时回退到内置 store.json 题目。
 * 返回的 id 按返回顺序从 1 重新编号（朋友版卡号是 1..N，与 DB 自增 id 无关）。
 */
export async function loadQuestions(): Promise<Question[]> {
  try {
    const res = await fetch('/truth-or-dare/api/sticks?edition=friend');
    const json = (await res.json()) as { success?: boolean; data?: FriendStick[] };
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      const mapped = json.data
        .map((s, i) => ({ id: i + 1, text: (s.front?.q ?? '').trim() }))
        .filter((q) => q.text.length > 0);
      if (mapped.length > 0) {
        dbQuestions = mapped;
        return mapped;
      }
    }
  } catch {
    // 接口不可用时回退到内置题目，游戏仍可玩
  }
  return getQuestions();
}

/** Format a question id as the card number mark, e.g. 7 -> "07". */
export const formatCardNo = (id: number): string =>
  String(id).padStart(2, '0');

/** One-line summary for the history list (plain truncation, no copy rewriting). */
export const summarize = (text: string, max = 34): string =>
  text.length > max ? `${text.slice(0, max)}…` : text;
