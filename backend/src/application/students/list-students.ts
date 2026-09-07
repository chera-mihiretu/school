import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { StudentStorePort } from "../../domain/ports/student-store-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import { authorizeCampusOffice } from "../teachers/authorize-campus.ts";
import { toStudentAdminView, type StudentAdminView } from "./views.ts";

export type ListSchoolStudentsInput = {
  hostHeader: string;
  token: string | undefined;
};

export type ListSchoolStudentsResult =
  | { ok: true; students: StudentAdminView[] }
  | { ok: false; status: 401 | 403; error: string };

export type ListSchoolStudents = (
  input: ListSchoolStudentsInput,
) => Promise<ListSchoolStudentsResult>;

export function createListSchoolStudents(deps: {
  rootHost: string;
  tenants: TenantStorePort;
  students: StudentStorePort;
  sessions: SchoolSessionSignerPort;
}): ListSchoolStudents {
  const { rootHost, tenants, students, sessions } = deps;

  return async (input) => {
    const authorized = await authorizeCampusOffice({
      hostHeader: input.hostHeader,
      token: input.token,
      rootHost,
      tenants,
      sessions,
    });
    if (!authorized.ok) {
      return authorized;
    }

    await students.ensureSchema(authorized.context.slug);
    const rows = await students.listNewestFirst(authorized.context.slug);
    return { ok: true, students: rows.map(toStudentAdminView) };
  };
}
