import type { TenantStatus } from "../../domain/ports/tenant-directory-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import { isTenantId } from "../../domain/tenants/tenant.ts";
import { rejectIfNotAdminHost } from "../platform-admin/require-admin-host.ts";
import { toTenantAdminView, type TenantAdminView } from "./views.ts";

export type SetTenantStatusInput = {
  hostHeader: string;
  id: string;
};

export type SetTenantStatusResult =
  | { ok: true; school: TenantAdminView }
  | { ok: false; status: 403 | 404; error: string };

export type SetTenantStatus = (
  input: SetTenantStatusInput,
) => Promise<SetTenantStatusResult>;

export function createSetTenantStatus(deps: {
  rootHost: string;
  store: TenantStorePort;
  status: TenantStatus;
}): SetTenantStatus {
  const { rootHost, store, status } = deps;

  return async (input) => {
    const rejected = rejectIfNotAdminHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    if (!isTenantId(input.id)) {
      return { ok: false, status: 404, error: "Tenant not found" };
    }

    const updated = await store.setStatus(input.id, status);
    if (!updated.ok) {
      return { ok: false, status: 404, error: "Tenant not found" };
    }

    return { ok: true, school: toTenantAdminView(updated.tenant, rootHost) };
  };
}

export function createSuspendTenant(deps: {
  rootHost: string;
  store: TenantStorePort;
}): SetTenantStatus {
  return createSetTenantStatus({ ...deps, status: "suspended" });
}

export function createReactivateTenant(deps: {
  rootHost: string;
  store: TenantStorePort;
}): SetTenantStatus {
  return createSetTenantStatus({ ...deps, status: "active" });
}
