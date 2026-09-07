import type { MailerPort } from "../../domain/ports/mailer-port.ts";
import type { PasswordGeneratorPort } from "../../domain/ports/password-generator-port.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { StaffStorePort } from "../../domain/ports/staff-store-port.ts";
import type { StudentStorePort } from "../../domain/ports/student-store-port.ts";
import type { TeacherStorePort } from "../../domain/ports/teacher-store-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import {
  ABBREVIATION_REQUIRED,
  formatPersonId,
  personIdYearYy,
} from "../../domain/school-abbreviation/abbreviation.ts";
import {
  isStaffSex,
  normalizeEthiopianMobile,
  normalizePersonName,
  normalizeStaffEmail,
  STAFF_EMAIL_UNAVAILABLE,
  staffEmailsEqual,
  validateEthiopianMobile,
  validatePersonName,
  validateStaffEmail,
  validateStaffSex,
} from "../../domain/staff/staff.ts";
import { authorizeCampusDirector } from "../teachers/authorize-campus.ts";
import { sendStaffCredentials } from "./send-credentials.ts";
import { toStaffAdminView, type StaffAdminView } from "./views.ts";

export type CreateStaffInput = {
  hostHeader: string;
  token: string | undefined;
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: string;
  phone: string;
  email: string;
};

export type CreateStaffResult =
  | {
      ok: true;
      staff: StaffAdminView;
      credentials: { email: string; password: string; loginUrl: string; schoolId: string | null };
      emailSent: boolean;
      emailError?: string;
    }
  | { ok: false; status: 400 | 401 | 403 | 409; error: string };

export type CreateStaff = (input: CreateStaffInput) => Promise<CreateStaffResult>;

export function createCreateStaff(deps: {
  rootHost: string;
  adminEmail: string;
  publicUrls: PublicUrlPort;
  tenants: TenantStorePort;
  staffs: StaffStorePort;
  teachers: TeacherStorePort;
  students: StudentStorePort;
  hasher: PasswordHasherPort;
  mailer: MailerPort;
  passwords: PasswordGeneratorPort;
  sessions: SchoolSessionSignerPort;
  now?: () => Date;
}): CreateStaff {
  const {
    rootHost,
    adminEmail,
    publicUrls,
    tenants,
    staffs,
    teachers,
    students,
    hasher,
    mailer,
    passwords,
    sessions,
    now = () => new Date(),
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

    const abbreviation = authorized.context.tenant.abbreviation;
    if (abbreviation === null) {
      return { ok: false, status: 409, error: ABBREVIATION_REQUIRED };
    }

    const givenName = normalizePersonName(input.givenName);
    const fatherName = normalizePersonName(input.fatherName);
    const grandfatherName = normalizePersonName(input.grandfatherName);
    const invalidGiven = validatePersonName(givenName, "Given name");
    if (invalidGiven !== undefined) {
      return { ok: false, status: 400, error: invalidGiven };
    }
    const invalidFather = validatePersonName(fatherName, "Father name");
    if (invalidFather !== undefined) {
      return { ok: false, status: 400, error: invalidFather };
    }
    const invalidGrandfather = validatePersonName(
      grandfatherName,
      "Grandfather name",
    );
    if (invalidGrandfather !== undefined) {
      return { ok: false, status: 400, error: invalidGrandfather };
    }

    const invalidSex = validateStaffSex(input.sex);
    if (invalidSex !== undefined) {
      return { ok: false, status: 400, error: invalidSex };
    }
    if (!isStaffSex(input.sex)) {
      return { ok: false, status: 400, error: "Sex must be male or female" };
    }

    const invalidPhone = validateEthiopianMobile(input.phone);
    if (invalidPhone !== undefined) {
      return { ok: false, status: 400, error: invalidPhone };
    }
    const phone = normalizeEthiopianMobile(input.phone);
    if (phone === undefined) {
      return { ok: false, status: 400, error: "A valid Ethiopian mobile number is required" };
    }

    const email = normalizeStaffEmail(input.email);
    const invalidEmail = validateStaffEmail(email);
    if (invalidEmail !== undefined) {
      return { ok: false, status: 400, error: invalidEmail };
    }

    if (staffEmailsEqual(email, adminEmail)) {
      return { ok: false, status: 409, error: STAFF_EMAIL_UNAVAILABLE };
    }
    const directorEmail = authorized.context.tenant.email;
    if (directorEmail !== null && staffEmailsEqual(email, directorEmail)) {
      return { ok: false, status: 409, error: STAFF_EMAIL_UNAVAILABLE };
    }

    const existingStaff = await staffs.findByEmail(authorized.context.slug, email);
    if (existingStaff !== undefined) {
      return { ok: false, status: 409, error: STAFF_EMAIL_UNAVAILABLE };
    }
    const existingTeacher = await teachers.findByEmail(
      authorized.context.slug,
      email,
    );
    if (existingTeacher !== undefined) {
      return { ok: false, status: 409, error: STAFF_EMAIL_UNAVAILABLE };
    }
    const existingStudent = await students.findByEmail(
      authorized.context.slug,
      email,
    );
    if (existingStudent !== undefined) {
      return { ok: false, status: 409, error: STAFF_EMAIL_UNAVAILABLE };
    }

    const password = passwords.generate();
    const passwordHash = await hasher.hash(password);
    await staffs.ensureSchema(authorized.context.slug);
    const at = now();
    const yearYy = personIdYearYy(at);
    const n = await staffs.nextPersonNumber(
      authorized.context.slug,
      "F",
      yearYy,
    );
    const employeeId = formatPersonId({
      abbreviation,
      role: "F",
      n,
      yearYy,
    });
    const inserted = await staffs.insert(authorized.context.slug, {
      givenName,
      fatherName,
      grandfatherName,
      sex: input.sex,
      phone,
      email,
      employeeId,
      passwordHash,
    });
    if (!inserted.ok) {
      switch (inserted.reason) {
        case "email_taken":
          return { ok: false, status: 409, error: STAFF_EMAIL_UNAVAILABLE };
        default: {
          const _never: never = inserted.reason;
          return _never;
        }
      }
    }

    const sent = await sendStaffCredentials(
      { staffs, mailer, publicUrls },
      {
        slug: authorized.context.slug,
        staffId: inserted.staff.id,
        schoolName: authorized.context.tenant.name,
        email,
        password,
        schoolId: inserted.staff.employeeId,
      },
    );
    const staff = sent.staff ?? inserted.staff;

    return {
      ok: true,
      staff: toStaffAdminView(staff),
      credentials: {
        email,
        password,
        loginUrl: sent.loginUrl,
        schoolId: staff.employeeId,
      },
      emailSent: sent.emailSent,
      ...(sent.emailError !== undefined ? { emailError: sent.emailError } : {}),
    };
  };
}
