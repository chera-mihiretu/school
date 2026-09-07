import {
  campusCredentialsMailHtml,
  campusCredentialsMailSubject,
  campusCredentialsMailText,
  readCampusHost,
} from "../campus-mail/campus-credentials-mail.ts";

export type StudentCredentialsMailInput = {
  schoolName: string;
  email: string;
  password: string;
  loginUrl: string;
  schoolId: string | null;
};

export { readCampusHost };

export function studentCredentialsMailSubject(schoolName: string): string {
  return campusCredentialsMailSubject("student", schoolName);
}

export function studentCredentialsMailText(
  input: StudentCredentialsMailInput,
): string {
  return campusCredentialsMailText({ ...input, role: "student" });
}

export function studentCredentialsMailHtml(
  input: StudentCredentialsMailInput,
): string {
  return campusCredentialsMailHtml({ ...input, role: "student" });
}
