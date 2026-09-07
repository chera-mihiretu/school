import { rejectIfNotAppHost } from "../school-accounts/require-app-host.ts";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import { isAppSetupComplete } from "../../domain/school-accounts/session.ts";
import type { Tenant } from "../../domain/tenants/tenant.ts";

export type AppAbbreviationContext = {
  tenant: Tenant;
  accountId: string;
  email: string;
  expiresAt: Date;
};

export type AuthorizeAppAbbreviationResult =
  | { ok: true; context: AppAbbreviationContext }
  | { ok: false; status: 401 | 403 | 409; error: string };

export async function authorizeAppAbbreviationStep(input: {
  hostHeader: string;
  token: string | undefined;
  rootHost: string;
  tenants: TenantStorePort;
  sessions: SchoolSessionSignerPort;
}): Promise<AuthorizeAppAbbreviationResult> {
  const rejected = rejectIfNotAppHost(input.hostHeader, input.rootHost);
  if (rejected !== undefined) {
    return rejected;
  }

  if (input.token === undefined || input.token.length === 0) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const claims = input.sessions.read(input.token);
  if (claims === undefined) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const auth = await input.tenants.findAuthById(claims.accountId);
  if (auth === undefined) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  if (auth.tenant.status === "suspended") {
    return { ok: false, status: 403, error: "This school account is suspended" };
  }

  if (auth.tenant.mustChangePassword) {
    return { ok: false, status: 409, error: "Change your password first" };
  }

  if (auth.tenant.slug === null) {
    return { ok: false, status: 409, error: "Claim a username first" };
  }

  if (isAppSetupComplete(auth.tenant)) {
    return { ok: false, status: 403, error: "Use your campus host" };
  }

  const email = auth.tenant.email ?? claims.email;
  return {
    ok: true,
    context: {
      tenant: auth.tenant,
      accountId: auth.tenant.id,
      email,
      expiresAt: claims.expiresAt,
    },
  };
}
