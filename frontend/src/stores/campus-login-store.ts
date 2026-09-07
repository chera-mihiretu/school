"use client";

import { createAppStore } from "./create-store";
import type { CampusSessionView } from "@/features/school-account/school-account";

export type CampusLoginState = {
  identifier: string;
  password: string;
  newPassword: string;
  confirmPassword: string;
  pending: boolean;
  error: string | null;
  session: CampusSessionView | null;
  setIdentifier: (identifier: string) => void;
  setPassword: (password: string) => void;
  setNewPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  setError: (error: string | null) => void;
  setPending: (pending: boolean) => void;
  applySession: (session: CampusSessionView) => void;
  reset: () => void;
};

const emptyDraft = {
  identifier: "",
  password: "",
  newPassword: "",
  confirmPassword: "",
  pending: false,
  error: null as string | null,
  session: null as CampusSessionView | null,
};

export const useCampusLoginStore = createAppStore<CampusLoginState>((set) => ({
  ...emptyDraft,
  setIdentifier: (identifier) => {
    set({ identifier, error: null });
  },
  setPassword: (password) => {
    set({ password, error: null });
  },
  setNewPassword: (newPassword) => {
    set({ newPassword, error: null });
  },
  setConfirmPassword: (confirmPassword) => {
    set({ confirmPassword, error: null });
  },
  setError: (error) => {
    set({ error });
  },
  setPending: (pending) => {
    set({ pending });
  },
  applySession: (session) => {
    set({
      session,
      identifier: session.email,
      password: "",
      newPassword: "",
      confirmPassword: "",
      error: null,
      pending: false,
    });
  },
  reset: () => {
    set(emptyDraft);
  },
}));
