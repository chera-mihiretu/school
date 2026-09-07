import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { StaffStorePort } from "../../domain/ports/staff-store-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import { SCHOOL_PASSWORD_MIN_LENGTH } from "../../domain/school-accounts/password.ts";
import { authorizeCampusStaff } from "../teachers/authorize-campus.ts";
import { toStaffAdminView, type StaffAdminView } from "./views.ts";

export const STAFF_PASSWORD_ALREADY_CHANGED =
  "Password has already been changed";

export type ChangeStaffPasswordInput = {
  hostHeader: string;
  token: string | undefined;
  password: string;
};

export type ChangeStaffPasswordResult =
  | { ok: true; staff: StaffAdminView }
  | { ok: false; status: 400 | 401 | 403 | 409; error: string };

export type ChangeStaffPassword = (
  input: ChangeStaffPasswordInput,
) => Promise<ChangeStaffPasswordResult>;

export function createChangeStaffPassword(deps: {
  rootHost: string;
  tenants: TenantStorePort;
  staffs: StaffStorePort;
  hasher: PasswordHasherPort;
  sessions: SchoolSessionSignerPort;
}): ChangeStaffPassword {
  const { rootHost, tenants, staffs, hasher, sessions } = deps;

  return async (input) => {
    const authorized = await authorizeCampusStaff({
      hostHeader: input.hostHeader,
      token: input.token,
      rootHost,
      tenants,
      staffs,
      sessions,
    });
    if (!authorized.ok) {
      return authorized;
    }

    if (!authorized.staff.mustChangePassword) {
      return { ok: false, status: 409, error: STAFF_PASSWORD_ALREADY_CHANGED };
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
    const updated = await staffs.updatePassword(authorized.context.slug, {
      id: authorized.staff.id,
      passwordHash,
      mustChangePassword: false,
    });
    if (!updated.ok) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    return { ok: true, staff: toStaffAdminView(updated.staff) };
  };
}
