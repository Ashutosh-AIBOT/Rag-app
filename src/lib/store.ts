import { create } from "zustand";
import { persist } from "zustand/middleware";
import { QueryResponse } from "./api";

interface AppState {
  lastResult: QueryResponse | null;
  setLastResult: (r: QueryResponse | null) => void;
  history: any[];
  pushHistory: (r: any) => void;
  setHistory: (h: any[]) => void;
  highlightSource: string | null;
  setHighlightSource: (s: string | null) => void;
  selectedSources: string[];
  setSelectedSources: (s: string[] | ((prev: string[]) => string[])) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      lastResult: null,
      setLastResult: (r) => set({ lastResult: r }),
      history: [],
      pushHistory: (r) => set((s) => ({ history: [r, ...s.history].slice(0, 20) })),
      setHistory: (h) => set({ history: h }),
      highlightSource: null,
      setHighlightSource: (s) => set({ highlightSource: s }),
      selectedSources: [],
      setSelectedSources: (s) =>
        set((state) => ({
          selectedSources: typeof s === "function" ? s(state.selectedSources) : s,
        })),
    }),
    {
      name: "rag-app-store",
      partialize: (state) => ({ selectedSources: state.selectedSources }),
    }
  )
);
