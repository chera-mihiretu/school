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

export type StaffSex = TeacherSex;

export type Staff = {
  id: string;
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: StaffSex;
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

export const STAFF_EMAIL_UNAVAILABLE = TEACHER_EMAIL_UNAVAILABLE;

export const isStaffId = isTeacherId;
export const isStaffSex = isTeacherSex;
export const staffDisplayName = teacherDisplayName;
export const staffEmailsEqual = teacherEmailsEqual;
export const normalizeStaffEmail = normalizeTeacherEmail;
export const validateStaffEmail = validateTeacherEmail;
export const validateStaffSex = validateTeacherSex;

export {
  normalizeEthiopianMobile,
  normalizePersonName,
  validateEthiopianMobile,
  validatePersonName,
};
