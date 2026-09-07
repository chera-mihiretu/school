import type { MailerPort } from "../../domain/ports/mailer-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import type { Tenant } from "../../domain/tenants/tenant.ts";
import {
  credentialsMailHtml,
  credentialsMailSubject,
  credentialsMailText,
} from "./credentials-mail.ts";

export type SendTenantCredentialsInput = {
  tenantId: string;
  schoolName: string;
  email: string;
  password: string;
};

export type SendTenantCredentialsResult = {
  firstLoginUrl: string;
  emailSent: boolean;
  emailError?: string;
  tenant: Tenant | undefined;
};

export async function sendTenantCredentials(
  deps: {
    store: TenantStorePort;
    mailer: MailerPort;
    publicUrls: PublicUrlPort;
  },
  input: SendTenantCredentialsInput,
): Promise<SendTenantCredentialsResult> {
  const firstLoginUrl = deps.publicUrls.publicUrl({
    label: "app",
    path: `/first-login?email=${encodeURIComponent(input.email)}`,
  });
  const mail = {
    schoolName: input.schoolName,
    email: input.email,
    password: input.password,
    firstLoginUrl,
  };
  const sent = await deps.mailer.send({
    to: input.email,
    subject: credentialsMailSubject(input.schoolName),
    text: credentialsMailText(mail),
    html: credentialsMailHtml(mail),
  });
  const recorded = await deps.store.recordMailAttempt(input.tenantId, {
    ok: sent.ok,
    at: new Date(),
    ...(sent.ok ? {} : { error: sent.error }),
  });

  return {
    firstLoginUrl,
    emailSent: sent.ok,
    ...(sent.ok ? {} : { emailError: sent.error }),
    tenant: recorded.ok ? recorded.tenant : undefined,
  };
}
