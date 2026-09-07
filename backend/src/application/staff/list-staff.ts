import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { StaffStorePort } from "../../domain/ports/staff-store-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import { authorizeCampusDirector } from "../teachers/authorize-campus.ts";
import { toStaffAdminView, type StaffAdminView } from "./views.ts";

export type ListSchoolStaffInput = {
  hostHeader: string;
  token: string | undefined;
};

export type ListSchoolStaffResult =
  | { ok: true; staff: StaffAdminView[] }
  | { ok: false; status: 401 | 403; error: string };

export type ListSchoolStaff = (
  input: ListSchoolStaffInput,
) => Promise<ListSchoolStaffResult>;

export function createListSchoolStaff(deps: {
  rootHost: string;
  tenants: TenantStorePort;
  staffs: StaffStorePort;
  sessions: SchoolSessionSignerPort;
}): ListSchoolStaff {
  const { rootHost, tenants, staffs, sessions } = deps;

  return async (input) => {
    const authorized = await authorizeCampusDirector({
      hostHeader: input.hostHeader,
      token: input.token,
      rootHost,
      tenants,
      sessions,
    });
    if (!authorized.ok) {
      return authorized;
    }

    await staffs.ensureSchema(authorized.context.slug);
    const rows = await staffs.listNewestFirst(authorized.context.slug);
    return { ok: true, staff: rows.map(toStaffAdminView) };
  };
}
