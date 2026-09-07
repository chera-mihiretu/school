import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import {
  ABBREVIATION_EXHAUSTED,
  ABBREVIATION_LOCKED,
  ABBREVIATION_TAKEN,
  nextAbbreviation,
  normalizeAbbreviation,
  validateAbbreviation,
} from "../../domain/school-abbreviation/abbreviation.ts";
import type { Tenant } from "../../domain/tenants/tenant.ts";

export type ClaimAbbreviationCoreResult =
  | { ok: true; tenant: Tenant }
  | { ok: false; status: 400 | 401 | 409; error: string };

export async function claimTenantAbbreviation(input: {
  tenants: TenantStorePort;
  tenantId: string;
  abbreviation?: string;
}): Promise<ClaimAbbreviationCoreResult> {
  const requested = input.abbreviation?.trim() ?? "";
  let code: string;
  if (requested.length === 0) {
    const suggested = nextAbbreviation(
      new Set(await input.tenants.listAbbreviations()),
    );
    if (suggested === undefined) {
      return { ok: false, status: 409, error: ABBREVIATION_EXHAUSTED };
    }
    code = suggested;
  } else {
    const invalid = validateAbbreviation(requested);
    if (invalid !== undefined) {
      return { ok: false, status: 400, error: invalid };
    }
    code = normalizeAbbreviation(requested);
  }

  const claimed = await input.tenants.claimAbbreviation({
    id: input.tenantId,
    abbreviation: code,
  });
  if (!claimed.ok) {
    switch (claimed.reason) {
      case "not_found":
        return { ok: false, status: 401, error: "Unauthorized" };
      case "already_set":
        return { ok: false, status: 409, error: ABBREVIATION_LOCKED };
      case "taken":
        return { ok: false, status: 409, error: ABBREVIATION_TAKEN };
      default: {
        const _never: never = claimed.reason;
        return _never;
      }
    }
  }

  return { ok: true, tenant: claimed.tenant };
}
