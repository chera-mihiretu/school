import {
  isTeacherId,
  isTeacherSex,
  normalizeEthiopianMobile,
  normalizePersonName,
  normalizeTeacherEmail,
  TEACHER_EMAIL_UNAVAILABLE,
  teacherDisplayName,
  teacherEmailsEqual,
  type TeacherSex,
  validateEthiopianMobile,
  validatePersonName,
  validateTeacherEmail,
  validateTeacherSex,
} from "../teachers/teacher.ts";

export type StudentSex = TeacherSex;

export type Student = {
  id: string;
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: StudentSex;
  phone: string | null;
  email: string;
  employeeId: string | null;
  mustChangePassword: boolean;
  lastMailAt: Date | null;
  lastMailOk: boolean | null;
  lastMailError: string | null;
  signedInAt: Date | null;
  createdAt: Date;
};

export const STUDENT_EMAIL_UNAVAILABLE = TEACHER_EMAIL_UNAVAILABLE;

export const isStudentId = isTeacherId;
export const isStudentSex = isTeacherSex;
export const studentDisplayName = teacherDisplayName;
export const studentEmailsEqual = teacherEmailsEqual;
export const normalizeStudentEmail = normalizeTeacherEmail;
export const validateStudentEmail = validateTeacherEmail;
export const validateStudentSex = validateTeacherSex;

export {
  normalizeEthiopianMobile,
  normalizePersonName,
  validateEthiopianMobile,
  validatePersonName,
};

export function normalizeOptionalEthiopianMobile(
  raw: string,
): string | null | undefined {
  if (raw.trim().length === 0) {
    return null;
  }
  return normalizeEthiopianMobile(raw);
}

export function validateOptionalEthiopianMobile(
  raw: string,
): string | undefined {
  if (raw.trim().length === 0) {
    return undefined;
  }
  return validateEthiopianMobile(raw);
}
