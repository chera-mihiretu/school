import { schoolCampusHost } from "./claim-username.ts";
import { authorizeAppAbbreviationStep } from "./authorize-abbreviation.ts";
import { claimTenantAbbreviation } from "../school-abbreviation/claim-abbreviation.ts";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";

export type ClaimAppAbbreviationInput = {
  hostHeader: string;
  token: string | undefined;
  abbreviation?: string;
};

export type ClaimAppAbbreviationResult =
  | { ok: true; abbreviation: string; host: string; slug: string }
  | { ok: false; status: 400 | 401 | 403 | 409; error: string };

export type ClaimAppAbbreviation = (
  input: ClaimAppAbbreviationInput,
) => Promise<ClaimAppAbbreviationResult>;

export function createClaimAppAbbreviation(deps: {
  rootHost: string;
  tenants: TenantStorePort;
  sessions: SchoolSessionSignerPort;
}): ClaimAppAbbreviation {
  const { rootHost, tenants, sessions } = deps;

  return async (input) => {
    const authorized = await authorizeAppAbbreviationStep({
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
      tenantId: authorized.context.accountId,
      ...(input.abbreviation !== undefined
        ? { abbreviation: input.abbreviation }
        : {}),
    });
    if (!claimed.ok) {
      return claimed;
    }

    const slug = claimed.tenant.slug;
    const abbreviation = claimed.tenant.abbreviation;
    if (slug === null || abbreviation === null) {
      return { ok: false, status: 409, error: "Claim a username first" };
    }

    return {
      ok: true,
      abbreviation,
      slug,
      host: schoolCampusHost(slug, rootHost),
    };
  };
}
