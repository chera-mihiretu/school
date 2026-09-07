import { authorizeCampusDirector } from "../teachers/authorize-campus.ts";
import { claimTenantAbbreviation } from "../school-abbreviation/claim-abbreviation.ts";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";

export type ClaimSettingsAbbreviationInput = {
  hostHeader: string;
  token: string | undefined;
  abbreviation?: string;
};

export type ClaimSettingsAbbreviationResult =
  | { ok: true; abbreviation: string; locked: true }
  | { ok: false; status: 400 | 401 | 403 | 409; error: string };

export type ClaimSettingsAbbreviation = (
  input: ClaimSettingsAbbreviationInput,
) => Promise<ClaimSettingsAbbreviationResult>;

export function createClaimSettingsAbbreviation(deps: {
  rootHost: string;
  tenants: TenantStorePort;
  sessions: SchoolSessionSignerPort;
}): ClaimSettingsAbbreviation {
  const { rootHost, tenants, sessions } = deps;

  return async (input) => {
    const authorized = await authorizeCampusDirector({
      hostHeader: input.hostHeader,
      token: input.token,
      rootHost,
      tenants,
      sessions,
    });
    if (!authorized.ok) {
      return authorized;
    }

    const claimed = await claimTenantAbbreviation({
      tenants,
      tenantId: authorized.context.tenant.id,
      ...(input.abbreviation !== undefined
        ? { abbreviation: input.abbreviation }
        : {}),
    });
    if (!claimed.ok) {
      return claimed;
    }

    const abbreviation = claimed.tenant.abbreviation;
    if (abbreviation === null) {
      return { ok: false, status: 409, error: "This school already has an abbreviation." };
    }

    return { ok: true, abbreviation, locked: true };
  };
}
