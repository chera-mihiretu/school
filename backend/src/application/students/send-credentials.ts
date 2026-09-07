import type { MailerPort } from "../../domain/ports/mailer-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import type { StudentStorePort } from "../../domain/ports/student-store-port.ts";
import type { Student } from "../../domain/students/student.ts";
import {
  studentCredentialsMailHtml,
  studentCredentialsMailSubject,
  studentCredentialsMailText,
} from "./credentials-mail.ts";

export type SendStudentCredentialsInput = {
  slug: string;
  studentId: string;
  schoolName: string;
  email: string;
  password: string;
  schoolId: string | null;
};

export type SendStudentCredentialsResult = {
  loginUrl: string;
  emailSent: boolean;
  emailError?: string;
  student: Student | undefined;
};

export async function sendStudentCredentials(
  deps: {
    students: StudentStorePort;
    mailer: MailerPort;
    publicUrls: PublicUrlPort;
  },
  input: SendStudentCredentialsInput,
): Promise<SendStudentCredentialsResult> {
  const loginUrl = deps.publicUrls.publicUrl({
    label: input.slug,
    path: `/login?email=${encodeURIComponent(input.email)}`,
  });
  const mail = {
    schoolName: input.schoolName,
    email: input.email,
    password: input.password,
    loginUrl,
    schoolId: input.schoolId,
  };
  const sent = await deps.mailer.send({
    to: input.email,
    subject: studentCredentialsMailSubject(input.schoolName),
    text: studentCredentialsMailText(mail),
    html: studentCredentialsMailHtml(mail),
  });
  const recorded = await deps.students.recordMailAttempt(
    input.slug,
    input.studentId,
    {
      ok: sent.ok,
      at: new Date(),
      ...(sent.ok ? {} : { error: sent.error }),
    },
  );

  return {
    loginUrl,
    emailSent: sent.ok,
    ...(sent.ok ? {} : { emailError: sent.error }),
    student: recorded.ok ? recorded.student : undefined,
  };
}
