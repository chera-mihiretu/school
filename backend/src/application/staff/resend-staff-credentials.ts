import type { MailerPort } from "../../domain/ports/mailer-port.ts";
import type { PasswordGeneratorPort } from "../../domain/ports/password-generator-port.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { StaffStorePort } from "../../domain/ports/staff-store-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import { isStaffId } from "../../domain/staff/staff.ts";
import { authorizeCampusDirector } from "../teachers/authorize-campus.ts";
import { sendStaffCredentials } from "./send-credentials.ts";
import { toStaffAdminView, type StaffAdminView } from "./views.ts";

export const STAFF_RESEND_LOCKED =
  "Credentials cannot be resent after the password is changed";

export type ResendStaffCredentialsInput = {
  hostHeader: string;
  token: string | undefined;
  id: string;
};

export type ResendStaffCredentialsResult =
  | {
      ok: true;
      staff: StaffAdminView;
      credentials: { email: string; password: string; loginUrl: string; schoolId: string | null };
      emailSent: boolean;
      emailError?: string;
    }
  | { ok: false; status: 401 | 403 | 404 | 409; error: string };

export type ResendStaffCredentials = (
  input: ResendStaffCredentialsInput,
) => Promise<ResendStaffCredentialsResult>;

export function createResendStaffCredentials(deps: {
  rootHost: string;
  publicUrls: PublicUrlPort;
  tenants: TenantStorePort;
  staffs: StaffStorePort;
  hasher: PasswordHasherPort;
  mailer: MailerPort;
  passwords: PasswordGeneratorPort;
  sessions: SchoolSessionSignerPort;
}): ResendStaffCredentials {
  const {
    rootHost,
    publicUrls,
    tenants,
    staffs,
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

    if (!isStaffId(input.id)) {
      return { ok: false, status: 404, error: "Staff not found" };
    }

    const auth = await staffs.findAuthById(authorized.context.slug, input.id);
    if (auth === undefined) {
      return { ok: false, status: 404, error: "Staff not found" };
    }

    if (!auth.staff.mustChangePassword) {
      return { ok: false, status: 409, error: STAFF_RESEND_LOCKED };
    }

    const password = passwords.generate();
    const passwordHash = await hasher.hash(password);
    const updated = await staffs.updatePassword(authorized.context.slug, {
      id: auth.staff.id,
      passwordHash,
      mustChangePassword: true,
    });
    if (!updated.ok) {
      return { ok: false, status: 404, error: "Staff not found" };
    }

    const sent = await sendStaffCredentials(
      { staffs, mailer, publicUrls },
      {
        slug: authorized.context.slug,
        staffId: updated.staff.id,
        schoolName: authorized.context.tenant.name,
        email: updated.staff.email,
        password,
        schoolId: updated.staff.employeeId,
      },
    );
    const staff = sent.staff ?? updated.staff;

    return {
      ok: true,
      staff: toStaffAdminView(staff),
      credentials: {
        email: updated.staff.email,
        password,
        loginUrl: sent.loginUrl,
        schoolId: staff.employeeId,
      },
      emailSent: sent.emailSent,
      ...(sent.emailError !== undefined ? { emailError: sent.emailError } : {}),
    };
  };
}
