import {
  formatPersonId,
  parsePersonId,
  type PersonIdRole,
} from "../school-abbreviation/abbreviation.ts";
import { normalizeTenantEmail } from "../tenants/tenant.ts";

export const CAMPUS_LOGIN_INVALID = "Invalid email, school ID, or password";

export type CampusLoginIdentifier =
  | { kind: "email"; email: string }
  | { kind: "school_id"; schoolId: string; role: PersonIdRole | undefined };

export function compactSchoolId(value: string): string {
  return value.trim().replaceAll(/\s+/g, "").toUpperCase();
}

export function readCampusLoginIdentifier(
  raw: string,
): CampusLoginIdentifier | undefined {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const compact = compactSchoolId(trimmed);
  const parsed = parsePersonId(compact);
  if (parsed !== undefined) {
    return {
      kind: "school_id",
      schoolId: formatPersonId(parsed),
      role: parsed.role,
    };
  }

  if (trimmed.includes("@")) {
    return { kind: "email", email: normalizeTenantEmail(trimmed) };
  }

  return { kind: "school_id", schoolId: compact, role: undefined };
}
