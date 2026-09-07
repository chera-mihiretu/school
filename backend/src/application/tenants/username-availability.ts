import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import {
  isReservedSchoolSlug,
  isValidSchoolSlug,
  normalizeSchoolSlug,
} from "../../domain/school-slug.ts";

export type UsernameLookupReason = "invalid" | "reserved" | "taken";

export type UsernameAvailability =
  | { username: string; available: true }
  | { username: string; available: false; reason: UsernameLookupReason };

export async function lookupUsernameAvailability(
  store: TenantStorePort,
  slug: string,
): Promise<UsernameAvailability> {
  const username = normalizeSchoolSlug(slug);
  if (username.length === 0 || !isValidSchoolSlug(username)) {
    return { username, available: false, reason: "invalid" };
  }

  if (isReservedSchoolSlug(username)) {
    return { username, available: false, reason: "reserved" };
  }

  const existing = await store.findBySlug(username);
  if (existing !== undefined) {
    return { username, available: false, reason: "taken" };
  }

  return { username, available: true };
}
