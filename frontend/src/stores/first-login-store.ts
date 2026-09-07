"use client";

import { createAppStore } from "./create-store";
import type {
  SchoolAccountNextStep,
  SchoolSessionView,
  UsernameLookup,
} from "@/features/school-account/school-account";

export type FirstLoginState = {
  email: string;
  password: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  slug: string;
  finding: boolean;
  availability: UsernameLookup | null;
  understoodPermanent: boolean;
  pending: boolean;
  error: string | null;
  session: SchoolSessionView | null;
  nextStep: SchoolAccountNextStep | null;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setCurrentPassword: (password: string) => void;
  setNewPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  setSlug: (slug: string) => void;
  setFinding: (finding: boolean) => void;
  setAvailability: (availability: UsernameLookup | null) => void;
  setUnderstoodPermanent: (understood: boolean) => void;
  setError: (error: string | null) => void;
  setPending: (pending: boolean) => void;
  applySession: (session: SchoolSessionView) => void;
  hydrateEmail: (email: string) => void;
  clearSecrets: () => void;
  reset: () => void;
};

const emptyDraft = {
  email: "",
  password: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  slug: "",
  finding: false,
  availability: null as UsernameLookup | null,
  understoodPermanent: false,
  pending: false,
  error: null as string | null,
  session: null as SchoolSessionView | null,
  nextStep: null as SchoolAccountNextStep | null,
};

export const useFirstLoginStore = createAppStore<FirstLoginState>((set) => ({
  ...emptyDraft,
  setEmail: (email) => {
    set({ email, error: null });
  },
  setPassword: (password) => {
    set({ password, error: null });
  },
  setCurrentPassword: (currentPassword) => {
    set({ currentPassword, error: null });
  },
  setNewPassword: (newPassword) => {
    set({ newPassword, error: null });
  },
  setConfirmPassword: (confirmPassword) => {
    set({ confirmPassword, error: null });
  },
  setSlug: (slug) => {
    set({
      slug,
      availability: null,
      error: null,
      finding: slug.length > 0,
    });
  },
  setFinding: (finding) => {
    set({ finding });
  },
  setAvailability: (availability) => {
    set({ availability, finding: false });
  },
  setUnderstoodPermanent: (understoodPermanent) => {
    set({ understoodPermanent, error: null });
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
      nextStep: session.nextStep,
      email: session.email,
      password: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      error: null,
      pending: false,
    });
  },
  hydrateEmail: (email) => {
    set((state) => {
      if (state.email.length > 0) {
        return state;
      }
      return { email };
    });
  },
  clearSecrets: () => {
    set({
      password: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  },
  reset: () => {
    set(emptyDraft);
  },
}));
