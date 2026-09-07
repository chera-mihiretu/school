"use client";

import type {
  TeacherAdminView,
  TeacherCredentials,
  TeacherSex,
} from "@/features/school-teachers/school-teachers";
import { createAppStore } from "./create-store";

export type TeachersStatus = "idle" | "loading" | "error";

export type TeachersState = {
  teachers: TeacherAdminView[];
  hydrated: boolean;
  status: TeachersStatus;
  error: string | null;
  listError: string | null;
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: TeacherSex | "";
  phone: string;
  email: string;
  pending: boolean;
  resendPendingId: string | null;
  resendError: string | null;
  credentials: TeacherCredentials | null;
  emailSent: boolean | null;
  emailError: string | null;
  revealOpen: boolean;
  hydrate: (teachers: TeacherAdminView[]) => void;
  setTeachers: (teachers: TeacherAdminView[]) => void;
  setStatus: (status: TeachersStatus) => void;
  setGivenName: (givenName: string) => void;
  setFatherName: (fatherName: string) => void;
  setGrandfatherName: (grandfatherName: string) => void;
  setSex: (sex: TeacherSex | "") => void;
  setPhone: (phone: string) => void;
  setEmail: (email: string) => void;
  setError: (error: string | null) => void;
  setListError: (error: string | null) => void;
  setPending: (pending: boolean) => void;
  setResendPendingId: (id: string | null) => void;
  setResendError: (error: string | null) => void;
  reveal: (input: {
    teacher: TeacherAdminView;
    credentials: TeacherCredentials;
    emailSent: boolean;
    emailError?: string;
  }) => void;
  openResendDone: (input: {
    teacher: TeacherAdminView;
    credentials: TeacherCredentials;
    emailSent: boolean;
    emailError?: string;
  }) => void;
  dismissReveal: () => void;
  resetDraft: () => void;
  reset: () => void;
};

const emptyDraft = {
  teachers: [] as TeacherAdminView[],
  hydrated: false,
  status: "idle" as TeachersStatus,
  error: null as string | null,
  listError: null as string | null,
  givenName: "",
  fatherName: "",
  grandfatherName: "",
  sex: "" as TeacherSex | "",
  phone: "",
  email: "",
  pending: false,
  resendPendingId: null as string | null,
  resendError: null as string | null,
  credentials: null as TeacherCredentials | null,
  emailSent: null as boolean | null,
  emailError: null as string | null,
  revealOpen: false,
};

function upsertTeacher(
  teachers: TeacherAdminView[],
  teacher: TeacherAdminView,
): TeacherAdminView[] {
  const index = teachers.findIndex((row) => row.id === teacher.id);
  if (index === -1) {
    return [teacher, ...teachers];
  }

  return teachers.map((row, rowIndex) => (rowIndex === index ? teacher : row));
}

export const useTeachersStore = createAppStore<TeachersState>((set) => ({
  ...emptyDraft,
  hydrate: (teachers) => {
    set({
      teachers,
      hydrated: true,
      status: "idle",
    });
  },
    setTeachers: (teachers) => {
      set({ teachers, hydrated: true, status: "idle", listError: null });
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
      teachers: upsertTeacher(state.teachers, input.teacher),
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
      teachers: upsertTeacher(state.teachers, input.teacher),
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
