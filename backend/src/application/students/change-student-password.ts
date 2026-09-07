import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { StudentStorePort } from "../../domain/ports/student-store-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import { SCHOOL_PASSWORD_MIN_LENGTH } from "../../domain/school-accounts/password.ts";
import { authorizeCampusStudent } from "../teachers/authorize-campus.ts";
import { toStudentAdminView, type StudentAdminView } from "./views.ts";

export const STUDENT_PASSWORD_ALREADY_CHANGED =
  "Password has already been changed";

export type ChangeStudentPasswordInput = {
  hostHeader: string;
  token: string | undefined;
  password: string;
};

export type ChangeStudentPasswordResult =
  | { ok: true; student: StudentAdminView }
  | { ok: false; status: 400 | 401 | 403 | 409; error: string };

export type ChangeStudentPassword = (
  input: ChangeStudentPasswordInput,
) => Promise<ChangeStudentPasswordResult>;

export function createChangeStudentPassword(deps: {
  rootHost: string;
  tenants: TenantStorePort;
  students: StudentStorePort;
  hasher: PasswordHasherPort;
  sessions: SchoolSessionSignerPort;
}): ChangeStudentPassword {
  const { rootHost, tenants, students, hasher, sessions } = deps;

  return async (input) => {
    const authorized = await authorizeCampusStudent({
      hostHeader: input.hostHeader,
      token: input.token,
      rootHost,
      tenants,
      students,
      sessions,
    });
    if (!authorized.ok) {
      return authorized;
    }

    if (!authorized.student.mustChangePassword) {
      return { ok: false, status: 409, error: STUDENT_PASSWORD_ALREADY_CHANGED };
    }

    if (input.password.length < SCHOOL_PASSWORD_MIN_LENGTH) {
      return {
        ok: false,
        status: 400,
        error: "Password must be at least 12 characters",
      };
    }

    if (await hasher.verify(authorized.passwordHash, input.password)) {
      return {
        ok: false,
        status: 400,
        error: "New password must be different from the current password",
      };
    }

    const passwordHash = await hasher.hash(input.password);
    const updated = await students.updatePassword(authorized.context.slug, {
      id: authorized.student.id,
      passwordHash,
      mustChangePassword: false,
    });
    if (!updated.ok) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    return { ok: true, student: toStudentAdminView(updated.student) };
  };
}
