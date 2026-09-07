import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { TeacherStorePort } from "../../domain/ports/teacher-store-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import { authorizeCampusDirector } from "./authorize-campus.ts";
import { toTeacherAdminView, type TeacherAdminView } from "./views.ts";

export type ListSchoolTeachersInput = {
  hostHeader: string;
  token: string | undefined;
};

export type ListSchoolTeachersResult =
  | { ok: true; teachers: TeacherAdminView[] }
  | { ok: false; status: 401 | 403; error: string };

export type ListSchoolTeachers = (
  input: ListSchoolTeachersInput,
) => Promise<ListSchoolTeachersResult>;

export function createListSchoolTeachers(deps: {
  rootHost: string;
  tenants: TenantStorePort;
  teachers: TeacherStorePort;
  sessions: SchoolSessionSignerPort;
}): ListSchoolTeachers {
  const { rootHost, tenants, teachers, sessions } = deps;

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

    await teachers.ensureSchema(authorized.context.slug);
    const rows = await teachers.listNewestFirst(authorized.context.slug);
    return { ok: true, teachers: rows.map(toTeacherAdminView) };
  };
}
