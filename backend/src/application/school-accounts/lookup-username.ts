import { rejectIfNotAppHost } from "./require-app-host.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import {
  lookupUsernameAvailability,
  type UsernameAvailability,
} from "../tenants/username-availability.ts";

export type LookupSchoolAccountUsernameInput = {
  hostHeader: string;
  accountId: string;
  slug: string;
};

export type LookupSchoolAccountUsernameResult =
  | ({ ok: true } & UsernameAvailability)
  | { ok: false; status: 403; error: string };

export type LookupSchoolAccountUsername = (
  input: LookupSchoolAccountUsernameInput,
) => Promise<LookupSchoolAccountUsernameResult>;

export function createLookupSchoolAccountUsername(deps: {
  rootHost: string;
  store: TenantStorePort;
}): LookupSchoolAccountUsername {
  const { rootHost, store } = deps;

  return async (input) => {
    const rejected = rejectIfNotAppHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    const auth = await store.findAuthById(input.accountId);
    if (auth === undefined) {
      return { ok: false, status: 403, error: "Unauthorized" };
    }

    if (auth.tenant.status === "suspended") {
      return { ok: false, status: 403, error: "This school account is suspended" };
    }

    if (auth.tenant.slug !== null) {
      return { ok: false, status: 403, error: "Use your campus host" };
    }

    const availability = await lookupUsernameAvailability(store, input.slug);
    return { ok: true, ...availability };
  };
}
