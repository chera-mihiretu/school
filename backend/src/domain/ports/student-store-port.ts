import type { PersonIdRole } from "../school-abbreviation/abbreviation.ts";
import type { Student, StudentSex } from "../students/student.ts";

export type StudentInsertInput = {
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: StudentSex;
  phone: string | null;
  email: string;
  employeeId: string | null;
  passwordHash: string;
};

export type StudentInsertResult =
  | { ok: true; student: Student }
  | { ok: false; reason: "email_taken" };

export type StudentUpdatePasswordResult =
  | { ok: true; student: Student }
  | { ok: false; reason: "not_found" };

export type StudentRecordMailResult =
  | { ok: true; student: Student }
  | { ok: false; reason: "not_found" };

export type StudentRecordSignInResult =
  | { ok: true; student: Student }
  | { ok: false; reason: "not_found" };

export type StudentMailAttempt = {
  ok: boolean;
  error?: string;
  at: Date;
};

export type StudentAuth = {
  student: Student;
  passwordHash: string;
};

export type StudentStorePort = {
  ensureSchema: (slug: string) => Promise<void>;
  nextPersonNumber: (
    slug: string,
    role: PersonIdRole,
    yearYy: string,
  ) => Promise<number>;
  insert: (slug: string, input: StudentInsertInput) => Promise<StudentInsertResult>;
  findByEmail: (slug: string, email: string) => Promise<Student | undefined>;
  findById: (slug: string, id: string) => Promise<Student | undefined>;
  findAuthByEmail: (
    slug: string,
    email: string,
  ) => Promise<StudentAuth | undefined>;
  findAuthByEmployeeId: (
    slug: string,
    employeeId: string,
  ) => Promise<StudentAuth | undefined>;
  findAuthById: (slug: string, id: string) => Promise<StudentAuth | undefined>;
  listNewestFirst: (slug: string) => Promise<Student[]>;
  updatePassword: (
    slug: string,
    input: {
      id: string;
      passwordHash: string;
      mustChangePassword: boolean;
    },
  ) => Promise<StudentUpdatePasswordResult>;
  recordMailAttempt: (
    slug: string,
    id: string,
    input: StudentMailAttempt,
  ) => Promise<StudentRecordMailResult>;
  recordSignIn: (
    slug: string,
    id: string,
    at: Date,
  ) => Promise<StudentRecordSignInResult>;
};
