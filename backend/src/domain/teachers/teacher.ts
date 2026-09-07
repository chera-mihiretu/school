import {
  emailsEqual,
  normalizeTenantEmail,
  validateTenantEmail,
} from "../tenants/tenant.ts";

export type TeacherSex = "male" | "female";

export type Teacher = {
  id: string;
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: TeacherSex;
  phone: string;
  email: string;
  employeeId: string | null;
  mustChangePassword: boolean;
  lastMailAt: Date | null;
  lastMailOk: boolean | null;
  lastMailError: string | null;
  signedInAt: Date | null;
  createdAt: Date;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_PERSON_NAME_LENGTH = 80;
const MAX_EMPLOYEE_ID_LENGTH = 64;
const ETHIOPIAN_MOBILE = /^[79]\d{8}$/;

export const TEACHER_EMAIL_UNAVAILABLE = "This email cannot be used.";

export function isTeacherId(id: string): boolean {
  return UUID_PATTERN.test(id);
}

export function isTeacherSex(value: string): value is TeacherSex {
  return value === "male" || value === "female";
}

export function teacherDisplayName(teacher: {
  givenName: string;
  fatherName: string;
  grandfatherName: string;
}): string {
  return `${teacher.givenName} ${teacher.fatherName} ${teacher.grandfatherName}`;
}

export function normalizePersonName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function validatePersonName(
  name: string,
  label: string,
): string | undefined {
  const normalized = normalizePersonName(name);
  if (normalized.length === 0) {
    return `${label} is required`;
  }
  if (normalized.length > MAX_PERSON_NAME_LENGTH) {
    return `${label} is too long`;
  }
  return undefined;
}

export function validateTeacherSex(value: string): string | undefined {
  if (!isTeacherSex(value)) {
    return "Sex must be male or female";
  }
  return undefined;
}

export function normalizeEthiopianMobile(raw: string): string | undefined {
  const compact = raw.trim().replace(/[\s\-().]/g, "");
  let national: string | undefined;

  if (compact.startsWith("+251")) {
    national = compact.slice(4);
  } else if (compact.startsWith("09") || compact.startsWith("07")) {
    if (compact.length !== 10) {
      return undefined;
    }
    national = compact.slice(1);
  } else if (
    (compact.startsWith("9") || compact.startsWith("7")) &&
    compact.length === 9
  ) {
    national = compact;
  } else {
    return undefined;
  }

  if (!ETHIOPIAN_MOBILE.test(national)) {
    return undefined;
  }
  return `+251${national}`;
}

export function validateEthiopianMobile(raw: string): string | undefined {
  if (raw.trim().length === 0) {
    return "Phone is required";
  }
  if (normalizeEthiopianMobile(raw) === undefined) {
    return "A valid Ethiopian mobile number is required";
  }
  return undefined;
}

export function normalizeEmployeeId(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function validateEmployeeId(value: string | null): string | undefined {
  if (value === null) {
    return undefined;
  }
  if (value.length > MAX_EMPLOYEE_ID_LENGTH) {
    return "Employee id is too long";
  }
  return undefined;
}

export function normalizeTeacherEmail(email: string): string {
  return normalizeTenantEmail(email);
}

export function teacherEmailsEqual(left: string, right: string): boolean {
  return emailsEqual(left, right);
}

export function validateTeacherEmail(email: string): string | undefined {
  return validateTenantEmail(email);
}
