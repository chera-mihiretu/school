import { rejectIfNotAppHost } from "./require-app-host.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import type { SchoolSignInView } from "../../domain/school-accounts/session.ts";
import {
  isAppSetupComplete,
  toSchoolSessionView,
} from "../../domain/school-accounts/session.ts";
import { normalizeTenantEmail } from "../../domain/tenants/tenant.ts";

export type SignInSchoolAccountInput = {
  email: string;
  password: string;
  hostHeader: string;
};

export type SignInSchoolAccountResult =
  | { ok: true; session: SchoolSignInView }
  | { ok: false; status: 401 | 403; error: string };

export type SignInSchoolAccount = (
  input: SignInSchoolAccountInput,
) => Promise<SignInSchoolAccountResult>;

export function createSignInSchoolAccount(deps: {
  rootHost: string;
  store: TenantStorePort;
  hasher: PasswordHasherPort;
  sessions: SchoolSessionSignerPort;
}): SignInSchoolAccount {
  const { rootHost, store, hasher, sessions } = deps;

  return async (input) => {
    const rejected = rejectIfNotAppHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    const email = normalizeTenantEmail(input.email);
    const auth = await store.findAuthByEmail(email);
    if (auth === undefined) {
      return { ok: false, status: 401, error: "Invalid email or password" };
    }

    if (auth.tenant.status === "suspended") {
      return { ok: false, status: 403, error: "This school account is suspended" };
    }

    if (isAppSetupComplete(auth.tenant)) {
      return { ok: false, status: 403, error: "Use your campus host" };
    }

    if (!(await hasher.verify(auth.passwordHash, input.password))) {
      return { ok: false, status: 401, error: "Invalid email or password" };
    }

    try {
      await store.recordDirectorSignIn(auth.tenant.id, new Date());
    } catch {
      // Sign-in still succeeds if first-open recording fails.
    }

    const issued = sessions.issue({
      accountId: auth.tenant.id,
      email,
    });
    const view = toSchoolSessionView({
      accountId: auth.tenant.id,
      email,
      expiresAt: issued.expiresAt,
      mustChangePassword: auth.tenant.mustChangePassword,
      slug: auth.tenant.slug,
      abbreviation: auth.tenant.abbreviation,
    });

    return {
      ok: true,
      session: {
        ...view,
        token: issued.token,
      },
    };
  };
}
