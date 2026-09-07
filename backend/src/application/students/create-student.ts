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
  isStudentSex,
  normalizeOptionalEthiopianMobile,
  normalizePersonName,
  normalizeStudentEmail,
  STUDENT_EMAIL_UNAVAILABLE,
  studentEmailsEqual,
  validateOptionalEthiopianMobile,
  validatePersonName,
  validateStudentEmail,
  validateStudentSex,
} from "../../domain/students/student.ts";
import { authorizeCampusOffice } from "../teachers/authorize-campus.ts";
import { sendStudentCredentials } from "./send-credentials.ts";
import { toStudentAdminView, type StudentAdminView } from "./views.ts";

export type CreateStudentInput = {
  hostHeader: string;
  token: string | undefined;
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: string;
  phone: string;
  email: string;
};

export type CreateStudentResult =
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
  | { ok: false; status: 400 | 401 | 403 | 409; error: string };

export type CreateStudent = (input: CreateStudentInput) => Promise<CreateStudentResult>;

export function createCreateStudent(deps: {
  rootHost: string;
  adminEmail: string;
  publicUrls: PublicUrlPort;
  tenants: TenantStorePort;
  students: StudentStorePort;
  staffs: StaffStorePort;
  teachers: TeacherStorePort;
  hasher: PasswordHasherPort;
  mailer: MailerPort;
  passwords: PasswordGeneratorPort;
  sessions: SchoolSessionSignerPort;
  now?: () => Date;
}): CreateStudent {
  const {
    rootHost,
    adminEmail,
    publicUrls,
    tenants,
    students,
    staffs,
    teachers,
    hasher,
    mailer,
    passwords,
    sessions,
    now = () => new Date(),
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

    const invalidSex = validateStudentSex(input.sex);
    if (invalidSex !== undefined) {
      return { ok: false, status: 400, error: invalidSex };
    }
    if (!isStudentSex(input.sex)) {
      return { ok: false, status: 400, error: "Sex must be male or female" };
    }

    const invalidPhone = validateOptionalEthiopianMobile(input.phone);
    if (invalidPhone !== undefined) {
      return { ok: false, status: 400, error: invalidPhone };
    }
    const phone = normalizeOptionalEthiopianMobile(input.phone);
    if (phone === undefined) {
      return {
        ok: false,
        status: 400,
        error: "A valid Ethiopian mobile number is required",
      };
    }

    const email = normalizeStudentEmail(input.email);
    const invalidEmail = validateStudentEmail(email);
    if (invalidEmail !== undefined) {
      return { ok: false, status: 400, error: invalidEmail };
    }

    if (studentEmailsEqual(email, adminEmail)) {
      return { ok: false, status: 409, error: STUDENT_EMAIL_UNAVAILABLE };
    }
    const directorEmail = authorized.context.tenant.email;
    if (directorEmail !== null && studentEmailsEqual(email, directorEmail)) {
      return { ok: false, status: 409, error: STUDENT_EMAIL_UNAVAILABLE };
    }

    const existingStudent = await students.findByEmail(
      authorized.context.slug,
      email,
    );
    if (existingStudent !== undefined) {
      return { ok: false, status: 409, error: STUDENT_EMAIL_UNAVAILABLE };
    }
    const existingStaff = await staffs.findByEmail(authorized.context.slug, email);
    if (existingStaff !== undefined) {
      return { ok: false, status: 409, error: STUDENT_EMAIL_UNAVAILABLE };
    }
    const existingTeacher = await teachers.findByEmail(
      authorized.context.slug,
      email,
    );
    if (existingTeacher !== undefined) {
      return { ok: false, status: 409, error: STUDENT_EMAIL_UNAVAILABLE };
    }

    const password = passwords.generate();
    const passwordHash = await hasher.hash(password);
    await students.ensureSchema(authorized.context.slug);
    const at = now();
    const yearYy = personIdYearYy(at);
    const n = await students.nextPersonNumber(
      authorized.context.slug,
      "S",
      yearYy,
    );
    const employeeId = formatPersonId({
      abbreviation,
      role: "S",
      n,
      yearYy,
    });
    const inserted = await students.insert(authorized.context.slug, {
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
          return { ok: false, status: 409, error: STUDENT_EMAIL_UNAVAILABLE };
        default: {
          const _never: never = inserted.reason;
          return _never;
        }
      }
    }

    const sent = await sendStudentCredentials(
      { students, mailer, publicUrls },
      {
        slug: authorized.context.slug,
        studentId: inserted.student.id,
        schoolName: authorized.context.tenant.name,
        email,
        password,
        schoolId: inserted.student.employeeId,
      },
    );
    const student = sent.student ?? inserted.student;

    return {
      ok: true,
      student: toStudentAdminView(student),
      credentials: {
        email,
        password,
        loginUrl: sent.loginUrl,
        schoolId: student.employeeId,
      },
      emailSent: sent.emailSent,
      ...(sent.emailError !== undefined ? { emailError: sent.emailError } : {}),
    };
  };
}
