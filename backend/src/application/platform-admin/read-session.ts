import type { SessionSignerPort } from "../../domain/ports/session-signer-port.ts";

export type ReadPlatformAdminSession = (
  token: string | undefined,
) => { email: string; expiresAt: string } | undefined;

export function createReadPlatformAdminSession(
  sessions: SessionSignerPort,
): ReadPlatformAdminSession {
  return (token) => {
    if (token === undefined || token.length === 0) {
      return undefined;
    }

    const claims = sessions.read(token);
    if (claims === undefined) {
      return undefined;
    }

    return {
      email: claims.email,
      expiresAt: claims.expiresAt.toISOString(),
    };
  };
}
