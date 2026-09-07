import type { MailerPort } from "../../domain/ports/mailer-port.ts";
import type { PasswordGeneratorPort } from "../../domain/ports/password-generator-port.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { StudentStorePort } from "../../domain/ports/student-store-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import { isStudentId } from "../../domain/students/student.ts";
import { authorizeCampusOffice } from "../teachers/authorize-campus.ts";
import { sendStudentCredentials } from "./send-credentials.ts";
import { toStudentAdminView, type StudentAdminView } from "./views.ts";

export const STUDENT_RESEND_LOCKED =
  "Credentials cannot be resent after the password is changed";

export type ResendStudentCredentialsInput = {
  hostHeader: string;
  token: string | undefined;
  id: string;
};

export type ResendStudentCredentialsResult =
  | {
      ok: true;
      student: StudentAdminView;
      credentials: {
        email: string;
        password: string;
        loginUrl: string;
        schoolId: string | null;
      };
      emailSent: boolean;
      emailError?: string;
    }
  | { ok: false; status: 401 | 403 | 404 | 409; error: string };

export type ResendStudentCredentials = (
  input: ResendStudentCredentialsInput,
) => Promise<ResendStudentCredentialsResult>;

export function createResendStudentCredentials(deps: {
  rootHost: string;
  publicUrls: PublicUrlPort;
  tenants: TenantStorePort;
  students: StudentStorePort;
  hasher: PasswordHasherPort;
  mailer: MailerPort;
  passwords: PasswordGeneratorPort;
  sessions: SchoolSessionSignerPort;
}): ResendStudentCredentials {
  const {
    rootHost,
    publicUrls,
    tenants,
    students,
    hasher,
    mailer,
    passwords,
    sessions,
  } = deps;

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

    if (!isStudentId(input.id)) {
      return { ok: false, status: 404, error: "Student not found" };
    }

    const auth = await students.findAuthById(authorized.context.slug, input.id);
    if (auth === undefined) {
      return { ok: false, status: 404, error: "Student not found" };
    }

    if (!auth.student.mustChangePassword) {
      return { ok: false, status: 409, error: STUDENT_RESEND_LOCKED };
    }

    const password = passwords.generate();
    const passwordHash = await hasher.hash(password);
    const updated = await students.updatePassword(authorized.context.slug, {
      id: auth.student.id,
      passwordHash,
      mustChangePassword: true,
    });
    if (!updated.ok) {
      return { ok: false, status: 404, error: "Student not found" };
    }

    const sent = await sendStudentCredentials(
      { students, mailer, publicUrls },
      {
        slug: authorized.context.slug,
        studentId: updated.student.id,
        schoolName: authorized.context.tenant.name,
        email: updated.student.email,
        password,
        schoolId: updated.student.employeeId,
      },
    );
    const student = sent.student ?? updated.student;

    return {
      ok: true,
      student: toStudentAdminView(student),
      credentials: {
        email: updated.student.email,
        password,
        loginUrl: sent.loginUrl,
        schoolId: student.employeeId,
      },
      emailSent: sent.emailSent,
      ...(sent.emailError !== undefined ? { emailError: sent.emailError } : {}),
    };
  };
}
