"use client";

import { createAppStore } from "./create-store";

export type CampusDashboardState = {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  reset: () => void;
};

const emptyState = {
  drawerOpen: false,
};

export const useCampusDashboardStore = createAppStore<CampusDashboardState>(
  (set) => ({
    ...emptyState,
    setDrawerOpen: (drawerOpen) => {
      set({ drawerOpen });
    },
    reset: () => {
      set(emptyState);
    },
  }),
);
