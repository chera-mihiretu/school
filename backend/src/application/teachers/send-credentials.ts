import type { MailerPort } from "../../domain/ports/mailer-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import type { TeacherStorePort } from "../../domain/ports/teacher-store-port.ts";
import type { Teacher } from "../../domain/teachers/teacher.ts";
import {
  teacherCredentialsMailHtml,
  teacherCredentialsMailSubject,
  teacherCredentialsMailText,
} from "./credentials-mail.ts";

export type SendTeacherCredentialsInput = {
  slug: string;
  teacherId: string;
  schoolName: string;
  email: string;
  password: string;
  schoolId: string | null;
};

export type SendTeacherCredentialsResult = {
  loginUrl: string;
  emailSent: boolean;
  emailError?: string;
  teacher: Teacher | undefined;
};

export async function sendTeacherCredentials(
  deps: {
    teachers: TeacherStorePort;
    mailer: MailerPort;
    publicUrls: PublicUrlPort;
  },
  input: SendTeacherCredentialsInput,
): Promise<SendTeacherCredentialsResult> {
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
    subject: teacherCredentialsMailSubject(input.schoolName),
    text: teacherCredentialsMailText(mail),
    html: teacherCredentialsMailHtml(mail),
  });
  const recorded = await deps.teachers.recordMailAttempt(input.slug, input.teacherId, {
    ok: sent.ok,
    at: new Date(),
    ...(sent.ok ? {} : { error: sent.error }),
  });

  return {
    loginUrl,
    emailSent: sent.ok,
    ...(sent.ok ? {} : { emailError: sent.error }),
    teacher: recorded.ok ? recorded.teacher : undefined,
  };
}
