import {
  nextAbbreviation,
  personIdYearYy,
  previewPersonIds,
  validateAbbreviation,
  type PersonIdRole,
} from "../../domain/school-abbreviation/abbreviation.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";

export type AbbreviationExamples = {
  teacher: string;
  student: string;
  staff: string;
};

export type AbbreviationPreview = {
  abbreviation: string | null;
  locked: boolean;
  suggested: string | null;
  examples: AbbreviationExamples | null;
};

export type AbbreviationLookupReason = "invalid" | "taken";

export type AbbreviationLookup =
  | { available: true; abbreviation: string }
  | { available: false; abbreviation: string; reason: AbbreviationLookupReason };

export async function readAbbreviationPreview(
  tenants: TenantStorePort,
  current: string | null,
  at: Date,
): Promise<AbbreviationPreview> {
  const taken = new Set(await tenants.listAbbreviations());
  const suggested = nextAbbreviation(taken) ?? null;
  const yearYy = personIdYearYy(at);
  const display = current ?? suggested;
  return {
    abbreviation: current,
    locked: current !== null,
    suggested,
    examples:
      display === null ? null : previewPersonIds(display, yearYy),
  };
}

export async function lookupAbbreviationCode(
  tenants: TenantStorePort,
  raw: string,
): Promise<AbbreviationLookup> {
  const invalid = validateAbbreviation(raw);
  const normalized = raw.trim().toUpperCase();
  if (invalid !== undefined) {
    return {
      available: false,
      abbreviation: normalized,
      reason: "invalid",
    };
  }
  const taken = new Set(await tenants.listAbbreviations());
  if (taken.has(normalized)) {
    return {
      available: false,
      abbreviation: normalized,
      reason: "taken",
    };
  }
  return { available: true, abbreviation: normalized };
}

export function personIdRoleLabel(role: PersonIdRole): string {
  switch (role) {
    case "T":
      return "teacher";
    case "S":
      return "student";
    case "F":
      return "staff";
    default: {
      const _never: never = role;
      return _never;
    }
  }
}
