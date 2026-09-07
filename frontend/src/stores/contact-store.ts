"use client";

import { createAppStore } from "./create-store";

export type ContactState = {
  sentTo: string | null;
  error: string | null;
  pending: boolean;
  setSentTo: (email: string | null) => void;
  setError: (error: string | null) => void;
  setPending: (pending: boolean) => void;
};

export const useContactStore = createAppStore<ContactState>((set) => ({
  sentTo: null,
  error: null,
  pending: false,
  setSentTo: (sentTo) => {
    set({ sentTo, error: null, pending: false });
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
