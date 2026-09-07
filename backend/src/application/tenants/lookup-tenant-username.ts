import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import { rejectIfNotAdminHost } from "../platform-admin/require-admin-host.ts";
import {
  lookupUsernameAvailability,
  type UsernameLookupReason,
} from "./username-availability.ts";

export type { UsernameLookupReason };

export type LookupTenantUsernameInput = {
  hostHeader: string;
  slug: string;
};

export type LookupTenantUsernameResult =
  | { ok: true; username: string; available: true }
  | { ok: true; username: string; available: false; reason: UsernameLookupReason }
  | { ok: false; status: 403; error: string };

export type LookupTenantUsername = (
  input: LookupTenantUsernameInput,
) => Promise<LookupTenantUsernameResult>;

export function createLookupTenantUsername(deps: {
  rootHost: string;
  store: TenantStorePort;
}): LookupTenantUsername {
  const { rootHost, store } = deps;

  return async (input) => {
    const rejected = rejectIfNotAdminHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    const availability = await lookupUsernameAvailability(store, input.slug);
    return { ok: true, ...availability };
  };
}
