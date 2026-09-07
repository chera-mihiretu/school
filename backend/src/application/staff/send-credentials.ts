import type { MailerPort } from "../../domain/ports/mailer-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import type { StaffStorePort } from "../../domain/ports/staff-store-port.ts";
import type { Staff } from "../../domain/staff/staff.ts";
import {
  staffCredentialsMailHtml,
  staffCredentialsMailSubject,
  staffCredentialsMailText,
} from "./credentials-mail.ts";

export type SendStaffCredentialsInput = {
  slug: string;
  staffId: string;
  schoolName: string;
  email: string;
  password: string;
  schoolId: string | null;
};

export type SendStaffCredentialsResult = {
  loginUrl: string;
  emailSent: boolean;
  emailError?: string;
  staff: Staff | undefined;
};

export async function sendStaffCredentials(
  deps: {
    staffs: StaffStorePort;
    mailer: MailerPort;
    publicUrls: PublicUrlPort;
  },
  input: SendStaffCredentialsInput,
): Promise<SendStaffCredentialsResult> {
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
    subject: staffCredentialsMailSubject(input.schoolName),
    text: staffCredentialsMailText(mail),
    html: staffCredentialsMailHtml(mail),
  });
  const recorded = await deps.staffs.recordMailAttempt(input.slug, input.staffId, {
    ok: sent.ok,
    at: new Date(),
    ...(sent.ok ? {} : { error: sent.error }),
  });

  return {
    loginUrl,
    emailSent: sent.ok,
    ...(sent.ok ? {} : { emailError: sent.error }),
    staff: recorded.ok ? recorded.staff : undefined,
  };
}
