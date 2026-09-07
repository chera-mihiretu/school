import { rejectIfNotAppHost } from "./require-app-host.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import {
  normalizeSchoolSlug,
  validateSchoolSlug,
} from "../../domain/school-slug.ts";

export type ClaimUsernameInput = {
  hostHeader: string;
  accountId: string;
  slug: string;
};

export type ClaimUsernameResult =
  | { ok: true; host: string; slug: string }
  | { ok: false; status: 400 | 403 | 409; error: string };

export type ClaimSchoolAccountUsername = (
  input: ClaimUsernameInput,
) => Promise<ClaimUsernameResult>;

export function schoolCampusHost(slug: string, rootHost: string): string {
  return `${slug}.${rootHost.toLowerCase()}`;
}

export function createClaimSchoolAccountUsername(deps: {
  rootHost: string;
  store: TenantStorePort;
}): ClaimSchoolAccountUsername {
  const { rootHost, store } = deps;

  return async (input) => {
    const rejected = rejectIfNotAppHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    const slug = normalizeSchoolSlug(input.slug);
    const invalid = validateSchoolSlug(slug);
    if (invalid !== undefined) {
      return { ok: false, status: 400, error: invalid };
    }

    const auth = await store.findAuthById(input.accountId);
    if (auth === undefined) {
      return { ok: false, status: 403, error: "Unauthorized" };
    }

    if (auth.tenant.status === "suspended") {
      return { ok: false, status: 403, error: "This school account is suspended" };
    }

    if (auth.tenant.mustChangePassword) {
      return { ok: false, status: 409, error: "Change your password first" };
    }

    const claimed = await store.claimSlug({
      id: auth.tenant.id,
      slug,
    });
    if (!claimed.ok) {
      switch (claimed.reason) {
        case "not_found":
          return { ok: false, status: 403, error: "Unauthorized" };
        case "slug_taken":
          return { ok: false, status: 409, error: `"${slug}" is already taken` };
        case "already_claimed":
          return {
            ok: false,
            status: 409,
            error: "This school already has a username",
          };
        default: {
          const _never: never = claimed.reason;
          return _never;
        }
      }
    }

    return {
      ok: true,
      slug,
      host: schoolCampusHost(slug, rootHost),
    };
  };
}
