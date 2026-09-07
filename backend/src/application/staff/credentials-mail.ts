import {
  campusCredentialsMailHtml,
  campusCredentialsMailSubject,
  campusCredentialsMailText,
  readCampusHost,
} from "../campus-mail/campus-credentials-mail.ts";

export type StaffCredentialsMailInput = {
  schoolName: string;
  email: string;
  password: string;
  loginUrl: string;
  schoolId: string | null;
};

export { readCampusHost };

export function staffCredentialsMailSubject(schoolName: string): string {
  return campusCredentialsMailSubject("staff", schoolName);
}

export function staffCredentialsMailText(
  input: StaffCredentialsMailInput,
): string {
  return campusCredentialsMailText({ ...input, role: "staff" });
}

export function staffCredentialsMailHtml(
  input: StaffCredentialsMailInput,
): string {
  return campusCredentialsMailHtml({ ...input, role: "staff" });
}
