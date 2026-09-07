import type { MailerPort } from "../../domain/ports/mailer-port.ts";
import type { PasswordGeneratorPort } from "../../domain/ports/password-generator-port.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import { isTenantId } from "../../domain/tenants/tenant.ts";
import { rejectIfNotAdminHost } from "../platform-admin/require-admin-host.ts";
import { sendTenantCredentials } from "./send-credentials.ts";
import { toTenantAdminView, type TenantAdminView } from "./views.ts";

export type ResendTenantCredentialsInput = {
  hostHeader: string;
  id: string;
};

export type ResendTenantCredentialsResult =
  | {
      ok: true;
      school: TenantAdminView;
      credentials: { email: string; password: string; firstLoginUrl: string };
      emailSent: boolean;
      emailError?: string;
    }
  | { ok: false; status: 403 | 404 | 409; error: string };

export type ResendTenantCredentials = (
  input: ResendTenantCredentialsInput,
) => Promise<ResendTenantCredentialsResult>;

export function createResendTenantCredentials(deps: {
  rootHost: string;
  publicUrls: PublicUrlPort;
  store: TenantStorePort;
  hasher: PasswordHasherPort;
  mailer: MailerPort;
  passwords: PasswordGeneratorPort;
}): ResendTenantCredentials {
  const { rootHost, publicUrls, store, hasher, mailer, passwords } = deps;

  return async (input) => {
    const rejected = rejectIfNotAdminHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    if (!isTenantId(input.id)) {
      return { ok: false, status: 404, error: "Tenant not found" };
    }

    const auth = await store.findAuthById(input.id);
    if (auth === undefined) {
      return { ok: false, status: 404, error: "Tenant not found" };
    }

    if (auth.tenant.status === "suspended") {
      return {
        ok: false,
        status: 409,
        error: "Cannot resend credentials while the school is suspended",
      };
    }

    if (auth.tenant.slug !== null) {
      return {
        ok: false,
        status: 409,
        error: "Credentials cannot be resent after the username is claimed",
      };
    }

    const email = auth.tenant.email;
    if (email === null) {
      return {
        ok: false,
        status: 409,
        error: "This school has no director email",
      };
    }

    const password = passwords.generate();
    const passwordHash = await hasher.hash(password);
    const updated = await store.updatePassword({
      id: auth.tenant.id,
      passwordHash,
      mustChangePassword: true,
    });
    if (!updated.ok) {
      return { ok: false, status: 404, error: "Tenant not found" };
    }

    const sent = await sendTenantCredentials(
      { store, mailer, publicUrls },
      {
        tenantId: updated.tenant.id,
        schoolName: updated.tenant.name,
        email,
        password,
      },
    );
    const school = sent.tenant ?? updated.tenant;

    return {
      ok: true,
      school: toTenantAdminView(school, rootHost),
      credentials: { email, password, firstLoginUrl: sent.firstLoginUrl },
      emailSent: sent.emailSent,
      ...(sent.emailError !== undefined ? { emailError: sent.emailError } : {}),
    };
  };
}
