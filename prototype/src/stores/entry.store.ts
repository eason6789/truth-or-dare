import { create } from 'zustand';

/**
 * 入口页状态:当前被聚焦的版本卡片。
 *  - none:   默认(两张卡片常规展示)
 *  - couple: 情侣版获得视觉强调(可点击,进入签桶)
 *  - friend: 朋友版强调展示(disabled,敬请期待)
 * 该字段仅驱动视觉分支,供快照审查;点击「情侣版」直接跳转 home 页。
 */

export type EditionFocus = 'none' | 'couple' | 'friend';

interface EntryState {
  focusedEdition: EditionFocus;
  setFocus: (edition: EditionFocus) => void;
}

export const useEntryStore = create<EntryState>((set) => ({
  focusedEdition: 'none',
  setFocus: (edition) => set({ focusedEdition: edition }),
}));
