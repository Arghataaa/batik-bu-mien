// SPA navigation store — Batik Bu Mien
// Single user-visible route "/"; the page uses this store to switch
// between Landing and Admin views (and which admin section is shown).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type View = "landing" | "admin";
export type AdminSection =
  | "dashboard"
  | "catalog"
  | "inventory"
  | "pos"
  | "reports"
  | "insights";

type UIState = {
  view: View;
  adminSection: AdminSection;
  loginDialogOpen: boolean;
  setView: (v: View) => void;
  setSection: (s: AdminSection) => void;
  openLogin: () => void;
  closeLogin: () => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      view: "landing",
      adminSection: "dashboard",
      loginDialogOpen: false,
      setView: (v) => set({ view: v }),
      setSection: (s) => set({ adminSection: s }),
      openLogin: () => set({ loginDialogOpen: true }),
      closeLogin: () => set({ loginDialogOpen: false }),
    }),
    {
      name: "batik-bu-mien-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        view: s.view,
        adminSection: s.adminSection,
      }),
    }
  )
);
