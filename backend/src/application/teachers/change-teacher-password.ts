import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { TeacherStorePort } from "../../domain/ports/teacher-store-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import { SCHOOL_PASSWORD_MIN_LENGTH } from "../../domain/school-accounts/password.ts";
import { authorizeCampusTeacher } from "./authorize-campus.ts";
import { toTeacherAdminView, type TeacherAdminView } from "./views.ts";

export const TEACHER_PASSWORD_ALREADY_CHANGED =
  "Password has already been changed";

export type ChangeTeacherPasswordInput = {
  hostHeader: string;
  token: string | undefined;
  password: string;
};

export type ChangeTeacherPasswordResult =
  | { ok: true; teacher: TeacherAdminView }
  | { ok: false; status: 400 | 401 | 403 | 409; error: string };

export type ChangeTeacherPassword = (
  input: ChangeTeacherPasswordInput,
) => Promise<ChangeTeacherPasswordResult>;

export function createChangeTeacherPassword(deps: {
  rootHost: string;
  tenants: TenantStorePort;
  teachers: TeacherStorePort;
  hasher: PasswordHasherPort;
  sessions: SchoolSessionSignerPort;
}): ChangeTeacherPassword {
  const { rootHost, tenants, teachers, hasher, sessions } = deps;

  return async (input) => {
    const authorized = await authorizeCampusTeacher({
      hostHeader: input.hostHeader,
      token: input.token,
      rootHost,
      tenants,
      teachers,
      sessions,
    });
    if (!authorized.ok) {
      return authorized;
    }

    if (!authorized.teacher.mustChangePassword) {
      return { ok: false, status: 409, error: TEACHER_PASSWORD_ALREADY_CHANGED };
    }

    if (input.password.length < SCHOOL_PASSWORD_MIN_LENGTH) {
      return { ok: false, status: 400, error: "Password must be at least 12 characters" };
    }

    if (await hasher.verify(authorized.passwordHash, input.password)) {
      return {
        ok: false,
        status: 400,
        error: "New password must be different from the current password",
      };
    }

    const passwordHash = await hasher.hash(input.password);
    const updated = await teachers.updatePassword(authorized.context.slug, {
      id: authorized.teacher.id,
      passwordHash,
      mustChangePassword: false,
    });
    if (!updated.ok) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    return { ok: true, teacher: toTeacherAdminView(updated.teacher) };
  };
}
