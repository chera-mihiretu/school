import {
  CAMPUS_HOST_ERROR,
  campusSlugFromHost,
  rejectIfNotCampusHost,
} from "../school-accounts/require-campus-host.ts";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { StudentStorePort } from "../../domain/ports/student-store-port.ts";
import type { StaffStorePort } from "../../domain/ports/staff-store-port.ts";
import type { TeacherStorePort } from "../../domain/ports/teacher-store-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import type { CampusAccountKind } from "../../domain/school-accounts/session.ts";
import type { Student } from "../../domain/students/student.ts";
import type { Staff } from "../../domain/staff/staff.ts";
import type { Teacher } from "../../domain/teachers/teacher.ts";
import type { Tenant } from "../../domain/tenants/tenant.ts";

export const DIRECTOR_ONLY_ERROR = "Only the school director can manage teachers";
export const TEACHER_ONLY_ERROR = "Only a teacher can change this password";
export const STAFF_ONLY_ERROR = "Only a staff member can change this password";
export const STUDENT_ONLY_ERROR = "Only a student can change this password";
export const OFFICE_ONLY_ERROR =
  "Only the school director or staff can manage students";
export const SCHOOL_INACTIVE_ERROR = "This school account is not active";

export type CampusActorContext = {
  slug: string;
  tenant: Tenant;
  accountId: string;
  email: string;
  expiresAt: Date;
  kind: CampusAccountKind;
};

export type AuthorizeCampusResult =
  | { ok: true; context: CampusActorContext }
  | { ok: false; status: 401 | 403; error: string };

export async function authorizeCampusDirector(input: {
  hostHeader: string;
  token: string | undefined;
  rootHost: string;
  tenants: TenantStorePort;
  sessions: SchoolSessionSignerPort;
}): Promise<AuthorizeCampusResult> {
  const authorized = await authorizeCampusSession(input);
  if (!authorized.ok) {
    return authorized;
  }
  switch (authorized.context.kind) {
    case "director":
      break;
    case "teacher":
    case "staff":
    case "student":
      return { ok: false, status: 403, error: DIRECTOR_ONLY_ERROR };
    default: {
      const _never: never = authorized.context.kind;
      return _never;
    }
  }
  if (authorized.context.accountId !== authorized.context.tenant.id) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  return authorized;
}

export async function authorizeCampusTeacher(input: {
  hostHeader: string;
  token: string | undefined;
  rootHost: string;
  tenants: TenantStorePort;
  teachers: TeacherStorePort;
  sessions: SchoolSessionSignerPort;
}): Promise<
  | { ok: true; context: CampusActorContext; teacher: Teacher; passwordHash: string }
  | { ok: false; status: 401 | 403; error: string }
> {
  const authorized = await authorizeCampusSession(input);
  if (!authorized.ok) {
    return authorized;
  }
  switch (authorized.context.kind) {
    case "teacher":
      break;
    case "director":
    case "staff":
    case "student":
      return { ok: false, status: 403, error: TEACHER_ONLY_ERROR };
    default: {
      const _never: never = authorized.context.kind;
      return _never;
    }
  }

  const auth = await input.teachers.findAuthById(
    authorized.context.slug,
    authorized.context.accountId,
  );
  if (auth === undefined) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true, context: authorized.context, ...auth };
}

export async function authorizeCampusStaff(input: {
  hostHeader: string;
  token: string | undefined;
  rootHost: string;
  tenants: TenantStorePort;
  staffs: StaffStorePort;
  sessions: SchoolSessionSignerPort;
}): Promise<
  | { ok: true; context: CampusActorContext; staff: Staff; passwordHash: string }
  | { ok: false; status: 401 | 403; error: string }
> {
  const authorized = await authorizeCampusSession(input);
  if (!authorized.ok) {
    return authorized;
  }
  switch (authorized.context.kind) {
    case "staff":
      break;
    case "director":
    case "teacher":
    case "student":
      return { ok: false, status: 403, error: STAFF_ONLY_ERROR };
    default: {
      const _never: never = authorized.context.kind;
      return _never;
    }
  }

  const auth = await input.staffs.findAuthById(
    authorized.context.slug,
    authorized.context.accountId,
  );
  if (auth === undefined) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true, context: authorized.context, ...auth };
}

export async function authorizeCampusOffice(input: {
  hostHeader: string;
  token: string | undefined;
  rootHost: string;
  tenants: TenantStorePort;
  sessions: SchoolSessionSignerPort;
}): Promise<AuthorizeCampusResult> {
  const authorized = await authorizeCampusSession(input);
  if (!authorized.ok) {
    return authorized;
  }
  switch (authorized.context.kind) {
    case "director":
      if (authorized.context.accountId !== authorized.context.tenant.id) {
        return { ok: false, status: 401, error: "Unauthorized" };
      }
      return authorized;
    case "staff":
      return authorized;
    case "teacher":
    case "student":
      return { ok: false, status: 403, error: OFFICE_ONLY_ERROR };
    default: {
      const _never: never = authorized.context.kind;
      return _never;
    }
  }
}

export async function authorizeCampusStudent(input: {
  hostHeader: string;
  token: string | undefined;
  rootHost: string;
  tenants: TenantStorePort;
  students: StudentStorePort;
  sessions: SchoolSessionSignerPort;
}): Promise<
  | { ok: true; context: CampusActorContext; student: Student; passwordHash: string }
  | { ok: false; status: 401 | 403; error: string }
> {
  const authorized = await authorizeCampusSession(input);
  if (!authorized.ok) {
    return authorized;
  }
  switch (authorized.context.kind) {
    case "student":
      break;
    case "director":
    case "teacher":
    case "staff":
      return { ok: false, status: 403, error: STUDENT_ONLY_ERROR };
    default: {
      const _never: never = authorized.context.kind;
      return _never;
    }
  }

  const auth = await input.students.findAuthById(
    authorized.context.slug,
    authorized.context.accountId,
  );
  if (auth === undefined) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true, context: authorized.context, ...auth };
}

async function authorizeCampusSession(input: {
  hostHeader: string;
  token: string | undefined;
  rootHost: string;
  tenants: TenantStorePort;
  sessions: SchoolSessionSignerPort;
}): Promise<AuthorizeCampusResult> {
  const rejected = rejectIfNotCampusHost(input.hostHeader, input.rootHost);
  if (rejected !== undefined) {
    return rejected;
  }

  const slug = campusSlugFromHost(input.hostHeader, input.rootHost);
  if (slug === undefined) {
    return { ok: false, status: 403, error: CAMPUS_HOST_ERROR };
  }

  if (input.token === undefined || input.token.length === 0) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const claims = input.sessions.read(input.token);
  if (claims === undefined || claims.kind === undefined) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const tenant = await input.tenants.findBySlug(slug);
  if (tenant === undefined) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  if (tenant.status !== "active") {
    return { ok: false, status: 403, error: SCHOOL_INACTIVE_ERROR };
  }

  return {
    ok: true,
    context: {
      slug,
      tenant,
      accountId: claims.accountId,
      email: claims.email,
      expiresAt: claims.expiresAt,
      kind: claims.kind,
    },
  };
}
