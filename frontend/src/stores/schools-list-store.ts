"use client";

import type { TenantSchool } from "@/features/platform-admin/tenants";
import { createAppStore } from "./create-store";

export type SchoolsListFilter = "all" | "active" | "suspended";
export type SchoolsListSort = "name" | "created" | "status";

export type SchoolsListCredentials = {
  email: string;
  password: string;
  firstLoginUrl: string;
};

export type SchoolsListConfirm =
  | { kind: "suspend"; school: TenantSchool }
  | { kind: "reactivate"; school: TenantSchool };

export type SchoolsListState = {
  filter: SchoolsListFilter;
  sort: SchoolsListSort;
  query: string;
  confirm: SchoolsListConfirm | null;
  typed: string;
  resendPending: boolean;
  resendError: string | null;
  resendDoneOpen: boolean;
  credentials: SchoolsListCredentials | null;
  emailSent: boolean;
  emailError: string | null;
  setFilter: (filter: SchoolsListFilter) => void;
  setSort: (sort: SchoolsListSort) => void;
  setQuery: (query: string) => void;
  setConfirm: (confirm: SchoolsListConfirm | null) => void;
  setTyped: (typed: string) => void;
  setResendPending: (pending: boolean) => void;
  setResendError: (error: string | null) => void;
  openResendDone: (input: {
    credentials: SchoolsListCredentials;
    emailSent: boolean;
    emailError?: string;
  }) => void;
  dismissResendDone: () => void;
  clearConfirm: () => void;
};

export const useSchoolsListStore = createAppStore<SchoolsListState>((set) => ({
  filter: "all",
  sort: "name",
  query: "",
  confirm: null,
  typed: "",
  resendPending: false,
  resendError: null,
  resendDoneOpen: false,
  credentials: null,
  emailSent: true,
  emailError: null,
  setFilter: (filter) => {
    set({ filter });
  },
  setSort: (sort) => {
    set({ sort });
  },
  setQuery: (query) => {
    set({ query });
  },
  setConfirm: (confirm) => {
    set({ confirm });
  },
  setTyped: (typed) => {
    set({ typed });
  },
  setResendPending: (pending) => {
    set({ resendPending: pending });
  },
  setResendError: (error) => {
    set({ resendError: error });
  },
  openResendDone: (input) => {
    set({
      resendDoneOpen: true,
      credentials: input.credentials,
      emailSent: input.emailSent,
      emailError: input.emailError ?? null,
      resendError: null,
      resendPending: false,
    });
  },
  dismissResendDone: () => {
    set({
      resendDoneOpen: false,
      credentials: null,
      emailError: null,
    });
  },
  clearConfirm: () => {
    set({ confirm: null, typed: "" });
  },
}));
