import {
  campusCredentialsMailHtml,
  campusCredentialsMailSubject,
  campusCredentialsMailText,
  readCampusHost,
} from "../campus-mail/campus-credentials-mail.ts";

export type TeacherCredentialsMailInput = {
  schoolName: string;
  email: string;
  password: string;
  loginUrl: string;
  schoolId: string | null;
};

export { readCampusHost };

export function teacherCredentialsMailSubject(schoolName: string): string {
  return campusCredentialsMailSubject("teacher", schoolName);
}

export function teacherCredentialsMailText(
  input: TeacherCredentialsMailInput,
): string {
  return campusCredentialsMailText({ ...input, role: "teacher" });
}

export function teacherCredentialsMailHtml(
  input: TeacherCredentialsMailInput,
): string {
  return campusCredentialsMailHtml({ ...input, role: "teacher" });
}
