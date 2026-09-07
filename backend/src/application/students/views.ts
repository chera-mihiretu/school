import {
  studentDisplayName,
  type Student,
  type StudentSex,
} from "../../domain/students/student.ts";

export type StudentAdminView = {
  id: string;
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  displayName: string;
  sex: StudentSex;
  phone: string | null;
  email: string;
  employeeId: string | null;
  mustChangePassword: boolean;
  lastMailAt: string | null;
  lastMailOk: boolean | null;
  lastMailError: string | null;
  signedInAt: string | null;
  createdAt: string;
};

export function toStudentAdminView(student: Student): StudentAdminView {
  return {
    id: student.id,
    givenName: student.givenName,
    fatherName: student.fatherName,
    grandfatherName: student.grandfatherName,
    displayName: studentDisplayName(student),
    sex: student.sex,
    phone: student.phone,
    email: student.email,
    employeeId: student.employeeId,
    mustChangePassword: student.mustChangePassword,
    lastMailAt: student.lastMailAt === null ? null : student.lastMailAt.toISOString(),
    lastMailOk: student.lastMailOk,
    lastMailError: student.lastMailError,
    signedInAt: student.signedInAt === null ? null : student.signedInAt.toISOString(),
    createdAt: student.createdAt.toISOString(),
  };
}
