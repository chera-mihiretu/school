import { staffDisplayName, type Staff, type StaffSex } from "../../domain/staff/staff.ts";

export type StaffAdminView = {
  id: string;
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  displayName: string;
  sex: StaffSex;
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

export function toStaffAdminView(staff: Staff): StaffAdminView {
  return {
    id: staff.id,
    givenName: staff.givenName,
    fatherName: staff.fatherName,
    grandfatherName: staff.grandfatherName,
    displayName: staffDisplayName(staff),
    sex: staff.sex,
    phone: staff.phone,
    email: staff.email,
    employeeId: staff.employeeId,
    mustChangePassword: staff.mustChangePassword,
    lastMailAt: staff.lastMailAt === null ? null : staff.lastMailAt.toISOString(),
    lastMailOk: staff.lastMailOk,
    lastMailError: staff.lastMailError,
    signedInAt: staff.signedInAt === null ? null : staff.signedInAt.toISOString(),
    createdAt: staff.createdAt.toISOString(),
  };
}
