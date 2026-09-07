"use client";

import { createAppStore } from "./create-store";

export type ContactInboxState = {
  selectedId: string | null;
  error: string | null;
  pending: boolean;
  select: (id: string) => void;
  close: () => void;
  setError: (error: string | null) => void;
  setPending: (pending: boolean) => void;
};

export const useContactInboxStore = createAppStore<ContactInboxState>((set) => ({
  selectedId: null,
  error: null,
  pending: false,
  select: (selectedId) => {
    set({ selectedId, error: null });
  },
  close: () => {
    set({ selectedId: null, error: null, pending: false });
  },
  setError: (error) => {
    set({ error, pending: false });
  },
  setPending: (pending) => {
    if (pending) {
      set({ pending, error: null });
      return;
    }
    set({ pending });
  },
}));
