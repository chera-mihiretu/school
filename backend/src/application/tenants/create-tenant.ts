import type { MailerPort } from "../../domain/ports/mailer-port.ts";
import type { PasswordGeneratorPort } from "../../domain/ports/password-generator-port.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import {
  normalizeSchoolName,
  validateSchoolName,
} from "../../domain/school-slug.ts";
import {
  emailsEqual,
  normalizeTenantEmail,
  TENANT_EMAIL_UNAVAILABLE,
  validateTenantEmail,
} from "../../domain/tenants/tenant.ts";
import { rejectIfNotAdminHost } from "../platform-admin/require-admin-host.ts";
import { sendTenantCredentials } from "./send-credentials.ts";
import { toTenantAdminView, type TenantAdminView } from "./views.ts";

export type CreateTenantInput = {
  hostHeader: string;
  name: string;
  email: string;
};

export type CreateTenantResult =
  | {
      ok: true;
      school: TenantAdminView;
      credentials: { email: string; password: string; firstLoginUrl: string };
      emailSent: boolean;
      emailError?: string;
    }
  | { ok: false; status: 400 | 403 | 409; error: string };

export type CreateTenant = (input: CreateTenantInput) => Promise<CreateTenantResult>;

export function createCreateTenant(deps: {
  rootHost: string;
  adminEmail: string;
  publicUrls: PublicUrlPort;
  store: TenantStorePort;
  hasher: PasswordHasherPort;
  mailer: MailerPort;
  passwords: PasswordGeneratorPort;
}): CreateTenant {
  const { rootHost, adminEmail, publicUrls, store, hasher, mailer, passwords } =
    deps;

  return async (input) => {
    const rejected = rejectIfNotAdminHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    const name = normalizeSchoolName(input.name);
    const invalidName = validateSchoolName(name);
    if (invalidName !== undefined) {
      return { ok: false, status: 400, error: invalidName };
    }

    const email = normalizeTenantEmail(input.email);
    const invalidEmail = validateTenantEmail(email);
    if (invalidEmail !== undefined) {
      return { ok: false, status: 400, error: invalidEmail };
    }

    if (emailsEqual(email, adminEmail)) {
      return { ok: false, status: 409, error: TENANT_EMAIL_UNAVAILABLE };
    }

    const existing = await store.findByEmail(email);
    if (existing !== undefined) {
      return { ok: false, status: 409, error: TENANT_EMAIL_UNAVAILABLE };
    }

    const password = passwords.generate();
    const passwordHash = await hasher.hash(password);
    const year = new Date().getUTCFullYear().toString();
    const inserted = await store.insertPending({
      name,
      email,
      passwordHash,
      founded: `Founded ${year}`,
    });
    if (!inserted.ok) {
      switch (inserted.reason) {
        case "email_taken":
          return { ok: false, status: 409, error: TENANT_EMAIL_UNAVAILABLE };
        default: {
          const _never: never = inserted.reason;
          return _never;
        }
      }
    }

    const sent = await sendTenantCredentials(
      { store, mailer, publicUrls },
      {
        tenantId: inserted.tenant.id,
        schoolName: name,
        email,
        password,
      },
    );
    const school = sent.tenant ?? inserted.tenant;

    return {
      ok: true,
      school: toTenantAdminView(school, rootHost),
      credentials: { email, password, firstLoginUrl: sent.firstLoginUrl },
      emailSent: sent.emailSent,
      ...(sent.emailError !== undefined ? { emailError: sent.emailError } : {}),
    };
  };
}
