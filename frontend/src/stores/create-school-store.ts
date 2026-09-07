"use client";

import type { TenantSchool } from "@/features/platform-admin/tenants";
import { createAppStore } from "./create-store";

export type CreateSchoolCredentials = {
  email: string;
  password: string;
  firstLoginUrl: string;
};

export type CreateSchoolDraftState = {
  name: string;
  email: string;
  error: string | null;
  pending: boolean;
  schoolId: string | null;
  school: TenantSchool | null;
  credentials: CreateSchoolCredentials | null;
  emailSent: boolean | null;
  emailError: string | null;
  resendPending: boolean;
  resendError: string | null;
  resendDoneOpen: boolean;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setError: (error: string | null) => void;
  setPending: (pending: boolean) => void;
  setResendPending: (pending: boolean) => void;
  setResendError: (error: string | null) => void;
  openResendDone: (input: {
    school: TenantSchool;
    credentials: CreateSchoolCredentials;
    emailSent: boolean;
    emailError?: string;
  }) => void;
  dismissResendDone: () => void;
  reveal: (input: {
    schoolId: string;
    school: TenantSchool;
    credentials: CreateSchoolCredentials;
    emailSent: boolean;
    emailError?: string;
  }) => void;
  reset: () => void;
};

const emptyDraft = {
  name: "",
  email: "",
  error: null as string | null,
  pending: false,
  schoolId: null as string | null,
  school: null as TenantSchool | null,
  credentials: null as CreateSchoolCredentials | null,
  emailSent: null as boolean | null,
  emailError: null as string | null,
  resendPending: false,
  resendError: null as string | null,
  resendDoneOpen: false,
};

export const useCreateSchoolStore = createAppStore<CreateSchoolDraftState>(
  (set) => ({
    ...emptyDraft,
    setName: (name) => {
      set({ name, error: null });
    },
    setEmail: (email) => {
      set({ email, error: null });
    },
    setError: (error) => {
      set({ error });
    },
    setPending: (pending) => {
      set({ pending });
    },
    setResendPending: (pending) => {
      set({ resendPending: pending });
    },
    setResendError: (error) => {
      set({ resendError: error });
    },
    openResendDone: (input) => {
      set({
        school: input.school,
        schoolId: input.school.id,
        credentials: input.credentials,
        emailSent: input.emailSent,
        emailError: input.emailError ?? null,
        resendDoneOpen: true,
        resendError: null,
        error: null,
        pending: false,
        resendPending: false,
      });
    },
    dismissResendDone: () => {
      set({ resendDoneOpen: false });
    },
    reveal: (input) => {
      set({
        schoolId: input.schoolId,
        school: input.school,
        credentials: input.credentials,
        emailSent: input.emailSent,
        emailError: input.emailError ?? null,
        error: null,
        pending: false,
        resendPending: false,
        resendError: null,
        resendDoneOpen: true,
      });
    },
    reset: () => {
      set(emptyDraft);
    },
  }),
);
