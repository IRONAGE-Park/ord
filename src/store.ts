import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FilterKey } from './types';
import { getDirectMaterials } from './data';

export type Deck = Record<number, number>; // unitId -> count

interface AppState {
  deck: Deck;
  past: Deck[];   // 직전 상태들 (undo로 복귀)
  future: Deck[]; // undo한 후 다시 갈 수 있는 상태들 (redo)
  filter: FilterKey;
  excludeEtcInCalc: boolean; // "계산 시 기타 포함" 체크 (기본 true → 기타 포함)
  showSkillTooltip: boolean;
  showLackedModal: boolean;
  lackedDisplayThreshold: number;
  showEtcInDeck: boolean;
  darkMode: 'auto' | 'dark' | 'light';
  recipeModalUnitId: number | null; // 조합 트리 모달 대상 (영속화 X)
  candidatesModalOpen: boolean; // 후보 비교 모달 (영속화 X)
  commandPaletteOpen: boolean; // 검색 팔레트 (영속화 X)
  sidebarPosition: 'left' | 'right' | 'bottom';
  sidebarWidth: number;
  sidebarHeight: number;
  sidebarCollapsed: boolean;

  // 액션
  add: (id: number, delta?: number) => void;
  remove: (id: number, delta?: number) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
  setFilter: (k: FilterKey) => void;
  combine: (resultId: number) => { ok: boolean; missing?: { id: number; count: number }[] };
  toggleEtcInCalc: () => void;
  toggleSkillTooltip: () => void;
  toggleLackedModal: () => void;
  setLackedDisplayThreshold: (n: number) => void;
  toggleShowEtcInDeck: () => void;
  setDarkMode: (m: 'auto' | 'dark' | 'light') => void;
  openRecipeModal: (id: number) => void;
  closeRecipeModal: () => void;
  openCandidatesModal: () => void;
  closeCandidatesModal: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setSidebarPosition: (p: 'left' | 'right' | 'bottom') => void;
  setSidebarWidth: (w: number) => void;
  setSidebarHeight: (h: number) => void;
  toggleSidebarCollapsed: () => void;
}

const EMPTY_DECK: Deck = {};
const HISTORY_LIMIT = 200;

function decksEqual(a: Deck, b: Deck): boolean {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) if (a[+k] !== b[+k]) return false;
  return true;
}

function snapshot(state: { deck: Deck; past: Deck[] }): {
  past: Deck[];
  future: Deck[];
} {
  const past = [...state.past, { ...state.deck }];
  if (past.length > HISTORY_LIMIT) past.shift();
  return { past, future: [] };
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      deck: EMPTY_DECK,
      past: [],
      future: [],
      filter: 'all',
      excludeEtcInCalc: false, // false = 기타 포함 (체크박스 checked 상태)
      showSkillTooltip: true,
      showLackedModal: true,
      lackedDisplayThreshold: 1,
      showEtcInDeck: true,
      darkMode: 'auto',
      recipeModalUnitId: null,
      candidatesModalOpen: false,
      commandPaletteOpen: false,
      sidebarPosition: 'left',
      sidebarWidth: 320,
      sidebarHeight: 320,
      sidebarCollapsed: false,

      add: (id, delta = 1) =>
        set(s => {
          const cur = s.deck[id] ?? 0;
          const next = Math.max(0, cur + delta);
          if (next === cur) return s;
          const deck = { ...s.deck };
          if (next === 0) delete deck[id];
          else deck[id] = next;
          return { deck, ...snapshot(s) };
        }),

      remove: (id, delta = 1) =>
        set(s => {
          const cur = s.deck[id] ?? 0;
          const next = Math.max(0, cur - delta);
          if (next === cur) return s;
          const deck = { ...s.deck };
          if (next === 0) delete deck[id];
          else deck[id] = next;
          return { deck, ...snapshot(s) };
        }),

      reset: () =>
        set(s => {
          if (Object.keys(s.deck).length === 0) return s;
          return { deck: {}, ...snapshot(s) };
        }),

      undo: () =>
        set(s => {
          if (s.past.length === 0) return s;
          const last = s.past[s.past.length - 1];
          return {
            deck: last,
            past: s.past.slice(0, -1),
            future: [...s.future, { ...s.deck }],
          };
        }),

      redo: () =>
        set(s => {
          if (s.future.length === 0) return s;
          const next = s.future[s.future.length - 1];
          return {
            deck: next,
            past: [...s.past, { ...s.deck }],
            future: s.future.slice(0, -1),
          };
        }),

      setFilter: (k) => set({ filter: k }),

      combine: (resultId) => {
        const state = get();
        const mats = getDirectMaterials(resultId);
        if (mats.length === 0) return { ok: false };

        const missing: { id: number; count: number }[] = [];
        for (const m of mats) {
          const have = state.deck[m.id] ?? 0;
          if (have < m.count) missing.push({ id: m.id, count: m.count - have });
        }
        if (missing.length > 0) {
          return { ok: false, missing };
        }

        const newDeck = { ...state.deck };
        for (const m of mats) {
          const newCount = newDeck[m.id] - m.count;
          if (newCount === 0) delete newDeck[m.id];
          else newDeck[m.id] = newCount;
        }
        newDeck[resultId] = (newDeck[resultId] ?? 0) + 1;

        if (decksEqual(newDeck, state.deck)) return { ok: true };

        set({
          deck: newDeck,
          ...snapshot(state),
        });
        return { ok: true };
      },

      toggleEtcInCalc: () => set(s => ({ excludeEtcInCalc: !s.excludeEtcInCalc })),
      toggleSkillTooltip: () => set(s => ({ showSkillTooltip: !s.showSkillTooltip })),
      toggleLackedModal: () => set(s => ({ showLackedModal: !s.showLackedModal })),
      setLackedDisplayThreshold: (n) => set({ lackedDisplayThreshold: n }),
      toggleShowEtcInDeck: () => set(s => ({ showEtcInDeck: !s.showEtcInDeck })),
      setDarkMode: (m) => set({ darkMode: m }),
      openRecipeModal: (id) => set({ recipeModalUnitId: id }),
      closeRecipeModal: () => set({ recipeModalUnitId: null }),
      openCandidatesModal: () => set({ candidatesModalOpen: true }),
      closeCandidatesModal: () => set({ candidatesModalOpen: false }),
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      setSidebarPosition: (p) => set({ sidebarPosition: p }),
      setSidebarWidth: (w) => set({ sidebarWidth: w }),
      setSidebarHeight: (h) => set({ sidebarHeight: h }),
      toggleSidebarCollapsed: () =>
        set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: 'ord-helper-state',
      partialize: (s) => ({
        deck: s.deck,
        excludeEtcInCalc: s.excludeEtcInCalc,
        showSkillTooltip: s.showSkillTooltip,
        showLackedModal: s.showLackedModal,
        lackedDisplayThreshold: s.lackedDisplayThreshold,
        showEtcInDeck: s.showEtcInDeck,
        darkMode: s.darkMode,
        sidebarPosition: s.sidebarPosition,
        sidebarWidth: s.sidebarWidth,
        sidebarHeight: s.sidebarHeight,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    }
  )
);
