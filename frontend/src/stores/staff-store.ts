"use client";

import type {
  StaffAdminView,
  StaffCredentials,
  StaffSex,
} from "@/features/school-staff/school-staff";
import { createAppStore } from "./create-store";

export type StaffStatus = "idle" | "loading" | "error";

export type StaffState = {
  staff: StaffAdminView[];
  hydrated: boolean;
  status: StaffStatus;
  error: string | null;
  listError: string | null;
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: StaffSex | "";
  phone: string;
  email: string;
  pending: boolean;
  resendPendingId: string | null;
  resendError: string | null;
  credentials: StaffCredentials | null;
  emailSent: boolean | null;
  emailError: string | null;
  revealOpen: boolean;
  hydrate: (staff: StaffAdminView[]) => void;
  setStaff: (staff: StaffAdminView[]) => void;
  setStatus: (status: StaffStatus) => void;
  setGivenName: (givenName: string) => void;
  setFatherName: (fatherName: string) => void;
  setGrandfatherName: (grandfatherName: string) => void;
  setSex: (sex: StaffSex | "") => void;
  setPhone: (phone: string) => void;
  setEmail: (email: string) => void;
  setError: (error: string | null) => void;
  setListError: (error: string | null) => void;
  setPending: (pending: boolean) => void;
  setResendPendingId: (id: string | null) => void;
  setResendError: (error: string | null) => void;
  reveal: (input: {
    staff: StaffAdminView;
    credentials: StaffCredentials;
    emailSent: boolean;
    emailError?: string;
  }) => void;
  openResendDone: (input: {
    staff: StaffAdminView;
    credentials: StaffCredentials;
    emailSent: boolean;
    emailError?: string;
  }) => void;
  dismissReveal: () => void;
  resetDraft: () => void;
  reset: () => void;
};

const emptyDraft = {
  staff: [] as StaffAdminView[],
  hydrated: false,
  status: "idle" as StaffStatus,
  error: null as string | null,
  listError: null as string | null,
  givenName: "",
  fatherName: "",
  grandfatherName: "",
  sex: "" as StaffSex | "",
  phone: "",
  email: "",
  pending: false,
  resendPendingId: null as string | null,
  resendError: null as string | null,
  credentials: null as StaffCredentials | null,
  emailSent: null as boolean | null,
  emailError: null as string | null,
  revealOpen: false,
};

function upsertStaff(
  staff: StaffAdminView[],
  member: StaffAdminView,
): StaffAdminView[] {
  const index = staff.findIndex((row) => row.id === member.id);
  if (index === -1) {
    return [member, ...staff];
  }

  return staff.map((row, rowIndex) => (rowIndex === index ? member : row));
}

export const useStaffStore = createAppStore<StaffState>((set) => ({
  ...emptyDraft,
  hydrate: (staff) => {
    set({
      staff,
      hydrated: true,
      status: "idle",
    });
  },
    setStaff: (staff) => {
      set({ staff, hydrated: true, status: "idle", listError: null });
    },
  setStatus: (status) => {
    set({ status });
  },
  setGivenName: (givenName) => {
    set({ givenName, error: null });
  },
  setFatherName: (fatherName) => {
    set({ fatherName, error: null });
  },
  setGrandfatherName: (grandfatherName) => {
    set({ grandfatherName, error: null });
  },
  setSex: (sex) => {
    set({ sex, error: null });
  },
  setPhone: (phone) => {
    set({ phone, error: null });
  },
  setEmail: (email) => {
    set({ email, error: null });
  },
  setError: (error) => {
    set({ error });
  },
  setListError: (listError) => {
    set({
      listError,
      status: listError === null ? "idle" : "error",
    });
  },
  setPending: (pending) => {
    set({ pending });
  },
  setResendPendingId: (resendPendingId) => {
    set({ resendPendingId });
  },
  setResendError: (resendError) => {
    set({ resendError });
  },
  reveal: (input) => {
    set((state) => ({
      staff: upsertStaff(state.staff, input.staff),
      credentials: input.credentials,
      emailSent: input.emailSent,
      emailError: input.emailError ?? null,
      revealOpen: true,
      givenName: "",
      fatherName: "",
      grandfatherName: "",
      sex: "",
      phone: "",
      email: "",
      error: null,
      pending: false,
      resendPendingId: null,
      resendError: null,
      status: "idle",
    }));
  },
  openResendDone: (input) => {
    set((state) => ({
      staff: upsertStaff(state.staff, input.staff),
      credentials: input.credentials,
      emailSent: input.emailSent,
      emailError: input.emailError ?? null,
      revealOpen: true,
      resendError: null,
      resendPendingId: null,
      error: null,
      pending: false,
    }));
  },
  dismissReveal: () => {
    set({
      revealOpen: false,
    });
  },
  resetDraft: () => {
    set({
      givenName: "",
      fatherName: "",
      grandfatherName: "",
      sex: "",
      phone: "",
      email: "",
      error: null,
      pending: false,
      credentials: null,
      emailSent: null,
      emailError: null,
      revealOpen: false,
      resendPendingId: null,
      resendError: null,
    });
  },
  reset: () => {
    set(emptyDraft);
  },
}));
