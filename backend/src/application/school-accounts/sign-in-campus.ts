import {
  CAMPUS_HOST_ERROR,
  campusSlugFromHost,
  rejectIfNotCampusHost,
} from "./require-campus-host.ts";
import { schoolCampusHost } from "./claim-username.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { StaffStorePort } from "../../domain/ports/staff-store-port.ts";
import type { StudentStorePort } from "../../domain/ports/student-store-port.ts";
import type { TeacherStorePort } from "../../domain/ports/teacher-store-port.ts";
import type { TenantAuth, TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import {
  CAMPUS_LOGIN_INVALID,
  readCampusLoginIdentifier,
} from "../../domain/school-accounts/login-identifier.ts";
import type { CampusAccountKind } from "../../domain/school-accounts/session.ts";
import type { Staff } from "../../domain/staff/staff.ts";
import type { Student } from "../../domain/students/student.ts";
import type { Teacher } from "../../domain/teachers/teacher.ts";

export type CampusSessionView = {
  accountId: string;
  email: string;
  expiresAt: string;
  slug: string;
  host: string;
  kind: CampusAccountKind;
  mustChangePassword: boolean;
};

export type CampusSignInView = CampusSessionView & {
  token: string;
};

export type SignInCampusAccountInput = {
  identifier: string;
  password: string;
  hostHeader: string;
};

export type SignInCampusAccountResult =
  | { ok: true; session: CampusSignInView }
  | { ok: false; status: 401 | 403; error: string };

export type SignInCampusAccount = (
  input: SignInCampusAccountInput,
) => Promise<SignInCampusAccountResult>;

export function createSignInCampusAccount(deps: {
  rootHost: string;
  store: TenantStorePort;
  teachers: TeacherStorePort;
  staffs: StaffStorePort;
  students: StudentStorePort;
  hasher: PasswordHasherPort;
  sessions: SchoolSessionSignerPort;
}): SignInCampusAccount {
  const { rootHost, store, teachers, staffs, students, hasher, sessions } = deps;

  return async (input) => {
    const rejected = rejectIfNotCampusHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    const hostSlug = campusSlugFromHost(input.hostHeader, rootHost);
    if (hostSlug === undefined) {
      return { ok: false, status: 403, error: CAMPUS_HOST_ERROR };
    }

    const identifier = readCampusLoginIdentifier(input.identifier);
    if (identifier === undefined) {
      return { ok: false, status: 401, error: CAMPUS_LOGIN_INVALID };
    }

    switch (identifier.kind) {
      case "email": {
        const director = await store.findAuthByEmail(identifier.email);
        if (director !== undefined) {
          return signInDirector({
            rootHost,
            store,
            hasher,
            sessions,
            hostSlug,
            email: identifier.email,
            password: input.password,
            auth: director,
          });
        }

        const teacherAuth = await teachers.findAuthByEmail(hostSlug, identifier.email);
        if (teacherAuth !== undefined) {
          return signInTeacher({
            rootHost,
            store,
            teachers,
            hasher,
            sessions,
            hostSlug,
            password: input.password,
            resolveAuth: async () => teacherAuth,
          });
        }

        const staffAuth = await staffs.findAuthByEmail(hostSlug, identifier.email);
        if (staffAuth !== undefined) {
          return signInStaff({
            rootHost,
            store,
            staffs,
            hasher,
            sessions,
            hostSlug,
            password: input.password,
            resolveAuth: async () => staffAuth,
          });
        }

        return signInStudent({
          rootHost,
          store,
          students,
          hasher,
          sessions,
          hostSlug,
          password: input.password,
          resolveAuth: () => students.findAuthByEmail(hostSlug, identifier.email),
        });
      }
      case "school_id": {
        switch (identifier.role) {
          case "S":
            return signInStudent({
              rootHost,
              store,
              students,
              hasher,
              sessions,
              hostSlug,
              password: input.password,
              resolveAuth: () =>
                students.findAuthByEmployeeId(hostSlug, identifier.schoolId),
            });
          case "T":
          case undefined:
            return signInTeacher({
              rootHost,
              store,
              teachers,
              hasher,
              sessions,
              hostSlug,
              password: input.password,
              resolveAuth: () =>
                teachers.findAuthByEmployeeId(hostSlug, identifier.schoolId),
            });
          case "F":
            return signInStaff({
              rootHost,
              store,
              staffs,
              hasher,
              sessions,
              hostSlug,
              password: input.password,
              resolveAuth: () =>
                staffs.findAuthByEmployeeId(hostSlug, identifier.schoolId),
            });
          default: {
            const _never: never = identifier.role;
            return _never;
          }
        }
      }
      default: {
        const _never: never = identifier;
        return _never;
      }
    }
  };
}

async function signInDirector(input: {
  rootHost: string;
  store: TenantStorePort;
  hasher: PasswordHasherPort;
  sessions: SchoolSessionSignerPort;
  hostSlug: string;
  email: string;
  password: string;
  auth: TenantAuth;
}): Promise<SignInCampusAccountResult> {
  const { auth } = input;

  if (auth.tenant.status !== "active") {
    return { ok: false, status: 403, error: "This school account is not active" };
  }

  if (auth.tenant.mustChangePassword) {
    return { ok: false, status: 403, error: "Change your password first" };
  }

  if (auth.tenant.slug === null || auth.tenant.slug !== input.hostSlug) {
    return { ok: false, status: 403, error: "Use your campus host" };
  }

  if (!(await input.hasher.verify(auth.passwordHash, input.password))) {
    return { ok: false, status: 401, error: CAMPUS_LOGIN_INVALID };
  }

  try {
    await input.store.recordDirectorSignIn(auth.tenant.id, new Date());
  } catch {
    // Sign-in still succeeds if first-open recording fails.
  }

  const issued = input.sessions.issue({
    accountId: auth.tenant.id,
    email: input.email,
    kind: "director",
  });

  return {
    ok: true,
    session: {
      accountId: auth.tenant.id,
      email: input.email,
      expiresAt: issued.expiresAt.toISOString(),
      slug: auth.tenant.slug,
      host: schoolCampusHost(auth.tenant.slug, input.rootHost),
      kind: "director",
      mustChangePassword: auth.tenant.mustChangePassword,
      token: issued.token,
    },
  };
}

async function signInTeacher(input: {
  rootHost: string;
  store: TenantStorePort;
  teachers: TeacherStorePort;
  hasher: PasswordHasherPort;
  sessions: SchoolSessionSignerPort;
  hostSlug: string;
  password: string;
  resolveAuth: () => Promise<{ teacher: Teacher; passwordHash: string } | undefined>;
}): Promise<SignInCampusAccountResult> {
  const tenant = await input.store.findBySlug(input.hostSlug);
  if (tenant === undefined) {
    return { ok: false, status: 401, error: CAMPUS_LOGIN_INVALID };
  }
  if (tenant.status !== "active") {
    return { ok: false, status: 403, error: "This school account is not active" };
  }

  const auth = await input.resolveAuth();
  if (auth === undefined) {
    return { ok: false, status: 401, error: CAMPUS_LOGIN_INVALID };
  }

  if (!(await input.hasher.verify(auth.passwordHash, input.password))) {
    return { ok: false, status: 401, error: CAMPUS_LOGIN_INVALID };
  }

  try {
    await input.teachers.recordSignIn(input.hostSlug, auth.teacher.id, new Date());
  } catch {
    // Sign-in still succeeds if first-open recording fails.
  }

  const issued = input.sessions.issue({
    accountId: auth.teacher.id,
    email: auth.teacher.email,
    kind: "teacher",
  });

  return {
    ok: true,
    session: {
      accountId: auth.teacher.id,
      email: auth.teacher.email,
      expiresAt: issued.expiresAt.toISOString(),
      slug: input.hostSlug,
      host: schoolCampusHost(input.hostSlug, input.rootHost),
      kind: "teacher",
      mustChangePassword: auth.teacher.mustChangePassword,
      token: issued.token,
    },
  };
}

async function signInStaff(input: {
  rootHost: string;
  store: TenantStorePort;
  staffs: StaffStorePort;
  hasher: PasswordHasherPort;
  sessions: SchoolSessionSignerPort;
  hostSlug: string;
  password: string;
  resolveAuth: () => Promise<{ staff: Staff; passwordHash: string } | undefined>;
}): Promise<SignInCampusAccountResult> {
  const tenant = await input.store.findBySlug(input.hostSlug);
  if (tenant === undefined) {
    return { ok: false, status: 401, error: CAMPUS_LOGIN_INVALID };
  }
  if (tenant.status !== "active") {
    return { ok: false, status: 403, error: "This school account is not active" };
  }

  const auth = await input.resolveAuth();
  if (auth === undefined) {
    return { ok: false, status: 401, error: CAMPUS_LOGIN_INVALID };
  }

  if (!(await input.hasher.verify(auth.passwordHash, input.password))) {
    return { ok: false, status: 401, error: CAMPUS_LOGIN_INVALID };
  }

  try {
    await input.staffs.recordSignIn(input.hostSlug, auth.staff.id, new Date());
  } catch {
    // Sign-in still succeeds if first-open recording fails.
  }

  const issued = input.sessions.issue({
    accountId: auth.staff.id,
    email: auth.staff.email,
    kind: "staff",
  });

  return {
    ok: true,
    session: {
      accountId: auth.staff.id,
      email: auth.staff.email,
      expiresAt: issued.expiresAt.toISOString(),
      slug: input.hostSlug,
      host: schoolCampusHost(input.hostSlug, input.rootHost),
      kind: "staff",
      mustChangePassword: auth.staff.mustChangePassword,
      token: issued.token,
    },
  };
}

async function signInStudent(input: {
  rootHost: string;
  store: TenantStorePort;
  students: StudentStorePort;
  hasher: PasswordHasherPort;
  sessions: SchoolSessionSignerPort;
  hostSlug: string;
  password: string;
  resolveAuth: () => Promise<{ student: Student; passwordHash: string } | undefined>;
}): Promise<SignInCampusAccountResult> {
  const tenant = await input.store.findBySlug(input.hostSlug);
  if (tenant === undefined) {
    return { ok: false, status: 401, error: CAMPUS_LOGIN_INVALID };
  }
  if (tenant.status !== "active") {
    return { ok: false, status: 403, error: "This school account is not active" };
  }

  const auth = await input.resolveAuth();
  if (auth === undefined) {
    return { ok: false, status: 401, error: CAMPUS_LOGIN_INVALID };
  }

  if (!(await input.hasher.verify(auth.passwordHash, input.password))) {
    return { ok: false, status: 401, error: CAMPUS_LOGIN_INVALID };
  }

  try {
    await input.students.recordSignIn(input.hostSlug, auth.student.id, new Date());
  } catch {
    // Sign-in still succeeds if first-open recording fails.
  }

  const issued = input.sessions.issue({
    accountId: auth.student.id,
    email: auth.student.email,
    kind: "student",
  });

  return {
    ok: true,
    session: {
      accountId: auth.student.id,
      email: auth.student.email,
      expiresAt: issued.expiresAt.toISOString(),
      slug: input.hostSlug,
      host: schoolCampusHost(input.hostSlug, input.rootHost),
      kind: "student",
      mustChangePassword: auth.student.mustChangePassword,
      token: issued.token,
    },
  };
}
