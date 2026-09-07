import {
  teacherDisplayName,
  type Teacher,
  type TeacherSex,
} from "../../domain/teachers/teacher.ts";

export type TeacherAdminView = {
  id: string;
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  displayName: string;
  sex: TeacherSex;
  phone: string;
  email: string;
  employeeId: string | null;
  mustChangePassword: boolean;
  lastMailAt: string | null;
  lastMailOk: boolean | null;
  lastMailError: string | null;
  signedInAt: string | null;
  createdAt: string;
};

export function toTeacherAdminView(teacher: Teacher): TeacherAdminView {
  return {
    id: teacher.id,
    givenName: teacher.givenName,
    fatherName: teacher.fatherName,
    grandfatherName: teacher.grandfatherName,
    displayName: teacherDisplayName(teacher),
    sex: teacher.sex,
    phone: teacher.phone,
    email: teacher.email,
    employeeId: teacher.employeeId,
    mustChangePassword: teacher.mustChangePassword,
    lastMailAt: teacher.lastMailAt === null ? null : teacher.lastMailAt.toISOString(),
    lastMailOk: teacher.lastMailOk,
    lastMailError: teacher.lastMailError,
    signedInAt: teacher.signedInAt === null ? null : teacher.signedInAt.toISOString(),
    createdAt: teacher.createdAt.toISOString(),
  };
}
