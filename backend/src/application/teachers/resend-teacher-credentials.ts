import type { MailerPort } from "../../domain/ports/mailer-port.ts";
import type { PasswordGeneratorPort } from "../../domain/ports/password-generator-port.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { TeacherStorePort } from "../../domain/ports/teacher-store-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import { isTeacherId } from "../../domain/teachers/teacher.ts";
import { authorizeCampusDirector } from "./authorize-campus.ts";
import { sendTeacherCredentials } from "./send-credentials.ts";
import { toTeacherAdminView, type TeacherAdminView } from "./views.ts";

export const TEACHER_RESEND_LOCKED =
  "Credentials cannot be resent after the password is changed";

export type ResendTeacherCredentialsInput = {
  hostHeader: string;
  token: string | undefined;
  id: string;
};

export type ResendTeacherCredentialsResult =
  | {
      ok: true;
      teacher: TeacherAdminView;
      credentials: { email: string; password: string; loginUrl: string; schoolId: string | null };
      emailSent: boolean;
      emailError?: string;
    }
  | { ok: false; status: 401 | 403 | 404 | 409; error: string };

export type ResendTeacherCredentials = (
  input: ResendTeacherCredentialsInput,
) => Promise<ResendTeacherCredentialsResult>;

export function createResendTeacherCredentials(deps: {
  rootHost: string;
  publicUrls: PublicUrlPort;
  tenants: TenantStorePort;
  teachers: TeacherStorePort;
  hasher: PasswordHasherPort;
  mailer: MailerPort;
  passwords: PasswordGeneratorPort;
  sessions: SchoolSessionSignerPort;
}): ResendTeacherCredentials {
  const {
    rootHost,
    publicUrls,
    tenants,
    teachers,
    hasher,
    mailer,
    passwords,
    sessions,
  } = deps;

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

    if (!isTeacherId(input.id)) {
      return { ok: false, status: 404, error: "Teacher not found" };
    }

    const auth = await teachers.findAuthById(authorized.context.slug, input.id);
    if (auth === undefined) {
      return { ok: false, status: 404, error: "Teacher not found" };
    }

    if (!auth.teacher.mustChangePassword) {
      return { ok: false, status: 409, error: TEACHER_RESEND_LOCKED };
    }

    const password = passwords.generate();
    const passwordHash = await hasher.hash(password);
    const updated = await teachers.updatePassword(authorized.context.slug, {
      id: auth.teacher.id,
      passwordHash,
      mustChangePassword: true,
    });
    if (!updated.ok) {
      return { ok: false, status: 404, error: "Teacher not found" };
    }

    const sent = await sendTeacherCredentials(
      { teachers, mailer, publicUrls },
      {
        slug: authorized.context.slug,
        teacherId: updated.teacher.id,
        schoolName: authorized.context.tenant.name,
        email: updated.teacher.email,
        password,
        schoolId: updated.teacher.employeeId,
      },
    );
    const teacher = sent.teacher ?? updated.teacher;

    return {
      ok: true,
      teacher: toTeacherAdminView(teacher),
      credentials: {
        email: updated.teacher.email,
        password,
        loginUrl: sent.loginUrl,
        schoolId: teacher.employeeId,
      },
      emailSent: sent.emailSent,
      ...(sent.emailError !== undefined ? { emailError: sent.emailError } : {}),
    };
  };
}
