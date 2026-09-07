import type { PersonIdRole } from "../school-abbreviation/abbreviation.ts";
import type { Teacher, TeacherSex } from "../teachers/teacher.ts";

export type TeacherInsertInput = {
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: TeacherSex;
  phone: string;
  email: string;
  employeeId: string | null;
  passwordHash: string;
};

export type TeacherInsertResult =
  | { ok: true; teacher: Teacher }
  | { ok: false; reason: "email_taken" };

export type TeacherUpdatePasswordResult =
  | { ok: true; teacher: Teacher }
  | { ok: false; reason: "not_found" };

export type TeacherRecordMailResult =
  | { ok: true; teacher: Teacher }
  | { ok: false; reason: "not_found" };

export type TeacherRecordSignInResult =
  | { ok: true; teacher: Teacher }
  | { ok: false; reason: "not_found" };

export type TeacherMailAttempt = {
  ok: boolean;
  error?: string;
  at: Date;
};

export type TeacherAuth = {
  teacher: Teacher;
  passwordHash: string;
};

export type TeacherStorePort = {
  ensureSchema: (slug: string) => Promise<void>;
  nextPersonNumber: (
    slug: string,
    role: PersonIdRole,
    yearYy: string,
  ) => Promise<number>;
  insert: (slug: string, input: TeacherInsertInput) => Promise<TeacherInsertResult>;
  findByEmail: (slug: string, email: string) => Promise<Teacher | undefined>;
  findById: (slug: string, id: string) => Promise<Teacher | undefined>;
  findAuthByEmail: (slug: string, email: string) => Promise<TeacherAuth | undefined>;
  findAuthByEmployeeId: (
    slug: string,
    employeeId: string,
  ) => Promise<TeacherAuth | undefined>;
  findAuthById: (slug: string, id: string) => Promise<TeacherAuth | undefined>;
  listNewestFirst: (slug: string) => Promise<Teacher[]>;
  updatePassword: (
    slug: string,
    input: {
      id: string;
      passwordHash: string;
      mustChangePassword: boolean;
    },
  ) => Promise<TeacherUpdatePasswordResult>;
  recordMailAttempt: (
    slug: string,
    id: string,
    input: TeacherMailAttempt,
  ) => Promise<TeacherRecordMailResult>;
  recordSignIn: (
    slug: string,
    id: string,
    at: Date,
  ) => Promise<TeacherRecordSignInResult>;
};
