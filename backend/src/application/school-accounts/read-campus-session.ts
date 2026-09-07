import {
  campusSlugFromHost,
  rejectIfNotCampusHost,
} from "./require-campus-host.ts";
import { schoolCampusHost } from "./claim-username.ts";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { StaffStorePort } from "../../domain/ports/staff-store-port.ts";
import type { StudentStorePort } from "../../domain/ports/student-store-port.ts";
import type { TeacherStorePort } from "../../domain/ports/teacher-store-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import type { CampusAccountKind } from "../../domain/school-accounts/session.ts";
import type { CampusSessionView } from "./sign-in-campus.ts";

export type ReadCampusAccountSessionInput = {
  token: string | undefined;
  hostHeader: string;
};

export type ReadCampusAccountSessionResult =
  | { ok: true; session: CampusSessionView }
  | { ok: false; status: 401 | 403; error: string };

export type ReadCampusAccountSession = (
  input: ReadCampusAccountSessionInput,
) => Promise<ReadCampusAccountSessionResult>;

export function createReadCampusAccountSession(deps: {
  rootHost: string;
  store: TenantStorePort;
  teachers: TeacherStorePort;
  staffs: StaffStorePort;
  students: StudentStorePort;
  sessions: SchoolSessionSignerPort;
}): ReadCampusAccountSession {
  const { rootHost, store, teachers, staffs, students, sessions } = deps;

  return async (input) => {
    const rejected = rejectIfNotCampusHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    const hostSlug = campusSlugFromHost(input.hostHeader, rootHost);
    if (hostSlug === undefined) {
      return { ok: false, status: 403, error: "Forbidden" };
    }

    if (input.token === undefined || input.token.length === 0) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    const claims = sessions.read(input.token);
    if (claims === undefined || claims.kind === undefined) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    switch (claims.kind) {
      case "director":
        return readDirectorSession({
          store,
          rootHost,
          hostSlug,
          accountId: claims.accountId,
          email: claims.email,
          expiresAt: claims.expiresAt,
        });
      case "teacher":
        return readTeacherSession({
          store,
          teachers,
          rootHost,
          hostSlug,
          accountId: claims.accountId,
          expiresAt: claims.expiresAt,
        });
      case "staff":
        return readStaffSession({
          store,
          staffs,
          rootHost,
          hostSlug,
          accountId: claims.accountId,
          expiresAt: claims.expiresAt,
        });
      case "student":
        return readStudentSession({
          store,
          students,
          rootHost,
          hostSlug,
          accountId: claims.accountId,
          expiresAt: claims.expiresAt,
        });
      default: {
        const _never: never = claims.kind;
        return _never;
      }
    }
  };
}

async function readDirectorSession(input: {
  store: TenantStorePort;
  rootHost: string;
  hostSlug: string;
  accountId: string;
  email: string;
  expiresAt: Date;
}): Promise<ReadCampusAccountSessionResult> {
  const auth = await input.store.findAuthById(input.accountId);
  if (auth === undefined) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  if (
    auth.tenant.status !== "active" ||
    auth.tenant.slug === null ||
    auth.tenant.slug !== input.hostSlug
  ) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return {
    ok: true,
    session: campusView({
      accountId: auth.tenant.id,
      email: auth.tenant.email ?? input.email,
      expiresAt: input.expiresAt,
      slug: auth.tenant.slug,
      rootHost: input.rootHost,
      kind: "director",
      mustChangePassword: auth.tenant.mustChangePassword,
    }),
  };
}

async function readTeacherSession(input: {
  store: TenantStorePort;
  teachers: TeacherStorePort;
  rootHost: string;
  hostSlug: string;
  accountId: string;
  expiresAt: Date;
}): Promise<ReadCampusAccountSessionResult> {
  const tenant = await input.store.findBySlug(input.hostSlug);
  if (tenant === undefined || tenant.status !== "active") {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const auth = await input.teachers.findAuthById(input.hostSlug, input.accountId);
  if (auth === undefined) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return {
    ok: true,
    session: campusView({
      accountId: auth.teacher.id,
      email: auth.teacher.email,
      expiresAt: input.expiresAt,
      slug: input.hostSlug,
      rootHost: input.rootHost,
      kind: "teacher",
      mustChangePassword: auth.teacher.mustChangePassword,
    }),
  };
}

async function readStaffSession(input: {
  store: TenantStorePort;
  staffs: StaffStorePort;
  rootHost: string;
  hostSlug: string;
  accountId: string;
  expiresAt: Date;
}): Promise<ReadCampusAccountSessionResult> {
  const tenant = await input.store.findBySlug(input.hostSlug);
  if (tenant === undefined || tenant.status !== "active") {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const auth = await input.staffs.findAuthById(input.hostSlug, input.accountId);
  if (auth === undefined) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return {
    ok: true,
    session: campusView({
      accountId: auth.staff.id,
      email: auth.staff.email,
      expiresAt: input.expiresAt,
      slug: input.hostSlug,
      rootHost: input.rootHost,
      kind: "staff",
      mustChangePassword: auth.staff.mustChangePassword,
    }),
  };
}

async function readStudentSession(input: {
  store: TenantStorePort;
  students: StudentStorePort;
  rootHost: string;
  hostSlug: string;
  accountId: string;
  expiresAt: Date;
}): Promise<ReadCampusAccountSessionResult> {
  const tenant = await input.store.findBySlug(input.hostSlug);
  if (tenant === undefined || tenant.status !== "active") {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const auth = await input.students.findAuthById(input.hostSlug, input.accountId);
  if (auth === undefined) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return {
    ok: true,
    session: campusView({
      accountId: auth.student.id,
      email: auth.student.email,
      expiresAt: input.expiresAt,
      slug: input.hostSlug,
      rootHost: input.rootHost,
      kind: "student",
      mustChangePassword: auth.student.mustChangePassword,
    }),
  };
}

function campusView(input: {
  accountId: string;
  email: string;
  expiresAt: Date;
  slug: string;
  rootHost: string;
  kind: CampusAccountKind;
  mustChangePassword: boolean;
}): CampusSessionView {
  return {
    accountId: input.accountId,
    email: input.email,
    expiresAt: input.expiresAt.toISOString(),
    slug: input.slug,
    host: schoolCampusHost(input.slug, input.rootHost),
    kind: input.kind,
    mustChangePassword: input.mustChangePassword,
  };
}
