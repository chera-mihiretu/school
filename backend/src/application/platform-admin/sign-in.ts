import { isPlatformAdminHost } from "../../domain/platform-admin/host.ts";
import { normalizeAdminEmail } from "../../domain/platform-admin/credentials.ts";
import type { PlatformAdminSession } from "../../domain/platform-admin/session.ts";
import type { PlatformAdminCredentialsPort } from "../../domain/ports/platform-admin-credentials-port.ts";
import type { SessionSignerPort } from "../../domain/ports/session-signer-port.ts";

export type SignInPlatformAdminInput = {
  email: string;
  password: string;
  hostHeader: string;
};

export type SignInPlatformAdminResult =
  | { ok: true; session: PlatformAdminSession }
  | { ok: false; status: 401 | 403; error: string };

export type SignInPlatformAdmin = (
  input: SignInPlatformAdminInput,
) => Promise<SignInPlatformAdminResult>;

export function createSignInPlatformAdmin(deps: {
  rootHost: string;
  credentials: PlatformAdminCredentialsPort;
  sessions: SessionSignerPort;
}): SignInPlatformAdmin {
  const { rootHost, credentials, sessions } = deps;

  return async (input) => {
    if (!isPlatformAdminHost(input.hostHeader, rootHost)) {
      return { ok: false, status: 403, error: "Admin login is only allowed on the admin host" };
    }

    const email = normalizeAdminEmail(input.email);
    if (!(await credentials.verify(email, input.password))) {
      return { ok: false, status: 401, error: "Invalid email or password" };
    }

    const issued = sessions.issue(email);
    return {
      ok: true,
      session: {
        email,
        token: issued.token,
        expiresAt: issued.expiresAt.toISOString(),
      },
    };
  };
}
