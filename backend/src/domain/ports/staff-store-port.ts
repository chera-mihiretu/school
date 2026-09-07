import type { PersonIdRole } from "../school-abbreviation/abbreviation.ts";
import type { Staff, StaffSex } from "../staff/staff.ts";

export type StaffInsertInput = {
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: StaffSex;
  phone: string;
  email: string;
  employeeId: string | null;
  passwordHash: string;
};

export type StaffInsertResult =
  | { ok: true; staff: Staff }
  | { ok: false; reason: "email_taken" };

export type StaffUpdatePasswordResult =
  | { ok: true; staff: Staff }
  | { ok: false; reason: "not_found" };

export type StaffRecordMailResult =
  | { ok: true; staff: Staff }
  | { ok: false; reason: "not_found" };

export type StaffRecordSignInResult =
  | { ok: true; staff: Staff }
  | { ok: false; reason: "not_found" };

export type StaffMailAttempt = {
  ok: boolean;
  error?: string;
  at: Date;
};

export type StaffAuth = {
  staff: Staff;
  passwordHash: string;
};

export type StaffStorePort = {
  ensureSchema: (slug: string) => Promise<void>;
  nextPersonNumber: (
    slug: string,
    role: PersonIdRole,
    yearYy: string,
  ) => Promise<number>;
  insert: (slug: string, input: StaffInsertInput) => Promise<StaffInsertResult>;
  findByEmail: (slug: string, email: string) => Promise<Staff | undefined>;
  findById: (slug: string, id: string) => Promise<Staff | undefined>;
  findAuthByEmail: (slug: string, email: string) => Promise<StaffAuth | undefined>;
  findAuthByEmployeeId: (
    slug: string,
    employeeId: string,
  ) => Promise<StaffAuth | undefined>;
  findAuthById: (slug: string, id: string) => Promise<StaffAuth | undefined>;
  listNewestFirst: (slug: string) => Promise<Staff[]>;
  updatePassword: (
    slug: string,
    input: {
      id: string;
      passwordHash: string;
      mustChangePassword: boolean;
    },
  ) => Promise<StaffUpdatePasswordResult>;
  recordMailAttempt: (
    slug: string,
    id: string,
    input: StaffMailAttempt,
  ) => Promise<StaffRecordMailResult>;
  recordSignIn: (
    slug: string,
    id: string,
    at: Date,
  ) => Promise<StaffRecordSignInResult>;
};
