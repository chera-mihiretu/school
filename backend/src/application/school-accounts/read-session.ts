import { rejectIfNotAppHost } from "./require-app-host.ts";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import type { SchoolSessionView } from "../../domain/school-accounts/session.ts";
import {
  isAppSetupComplete,
  toSchoolSessionView,
} from "../../domain/school-accounts/session.ts";

export type ReadSchoolAccountSessionInput = {
  token: string | undefined;
  hostHeader: string;
};

export type ReadSchoolAccountSessionResult =
  | { ok: true; session: SchoolSessionView }
  | { ok: false; status: 401 | 403; error: string };

export type ReadSchoolAccountSession = (
  input: ReadSchoolAccountSessionInput,
) => Promise<ReadSchoolAccountSessionResult>;

export function createReadSchoolAccountSession(deps: {
  rootHost: string;
  store: TenantStorePort;
  sessions: SchoolSessionSignerPort;
}): ReadSchoolAccountSession {
  const { rootHost, store, sessions } = deps;

  return async (input) => {
    const rejected = rejectIfNotAppHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    if (input.token === undefined || input.token.length === 0) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    const claims = sessions.read(input.token);
    if (claims === undefined) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    const auth = await store.findAuthById(claims.accountId);
    if (auth === undefined) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    if (auth.tenant.status === "suspended") {
      return { ok: false, status: 403, error: "This school account is suspended" };
    }

    if (isAppSetupComplete(auth.tenant)) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    return {
      ok: true,
      session: toSchoolSessionView({
        accountId: auth.tenant.id,
        email: auth.tenant.email ?? claims.email,
        expiresAt: claims.expiresAt,
        mustChangePassword: auth.tenant.mustChangePassword,
        slug: auth.tenant.slug,
        abbreviation: auth.tenant.abbreviation,
      }),
    };
  };
}
