"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Mini-tutoriales contextuales. Aparecen una sola vez según la pantalla
 * en la que entra el usuario. Después se marcan como vistos y el usuario
 * puede repetirlos manualmente desde /cuenta.
 */
export type TutorialKey =
  | "first-topic"
  | "first-session"
  | "first-test"
  | "first-flashcard"
  | "first-mastery";

interface TutorialState {
  /** Si el WelcomeTour del primer ingreso ya se vio. */
  welcomeSeen: boolean;
  welcomeOpen: boolean;
  /** Mini-tutoriales vistos. */
  seen: Partial<Record<TutorialKey, boolean>>;
  /** Mini-tutorial activo (si lo hubiera). */
  active: TutorialKey | null;
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  /** Abre el welcome tour (manual o primer ingreso). */
  openWelcome: () => void;
  /** Cierra y marca el welcome tour como visto. */
  closeWelcome: () => void;
  /** Muestra un mini-tutorial solo si no se vio antes. */
  showOnce: (k: TutorialKey) => void;
  /** Fuerza mostrar un mini-tutorial. */
  show: (k: TutorialKey) => void;
  /** Cierra el mini-tutorial activo y lo marca como visto. */
  dismiss: () => void;
  /** Olvida todo (welcome + mini-tutoriales) — para "Ver de nuevo". */
  resetAll: () => void;
  isSeen: (k: TutorialKey) => boolean;
}

const STORAGE_KEY = "spark:tutorial:v1";

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      welcomeSeen: false,
      welcomeOpen: false,
      seen: {},
      active: null,
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      openWelcome: () => set({ welcomeOpen: true, active: null }),
      closeWelcome: () => set({ welcomeOpen: false, welcomeSeen: true }),
      showOnce: (k) => {
        if (!get().hasHydrated) return;
        if (get().welcomeOpen) return;
        if (get().active) return;
        if (get().seen[k]) return;
        set({ active: k });
      },
      show: (k) => set({ active: k, welcomeOpen: false }),
      dismiss: () => {
        const cur = get().active;
        if (cur) {
          set((s) => ({ seen: { ...s.seen, [cur]: true }, active: null }));
        } else {
          set({ active: null });
        }
      },
      resetAll: () =>
        set({
          welcomeSeen: false,
          welcomeOpen: true,
          seen: {},
          active: null,
        }),
      isSeen: (k) => Boolean(get().seen[k]),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ welcomeSeen: s.welcomeSeen, seen: s.seen }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
