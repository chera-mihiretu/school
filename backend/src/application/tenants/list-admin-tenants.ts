import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import { rejectIfNotAdminHost } from "../platform-admin/require-admin-host.ts";
import { normalizePage, normalizePageSize } from "./pagination.ts";
import { toTenantAdminView, type TenantAdminView } from "./views.ts";

export type ListAdminTenantsInput = {
  hostHeader: string;
  page?: unknown;
  pageSize?: unknown;
};

export type ListAdminTenantsResult =
  | {
      ok: true;
      schools: TenantAdminView[];
      page: number;
      pageSize: number;
      total: number;
    }
  | { ok: false; status: 403; error: string };

export type ListAdminTenants = (
  input: ListAdminTenantsInput,
) => Promise<ListAdminTenantsResult>;

export function createListAdminTenants(deps: {
  rootHost: string;
  store: TenantStorePort;
}): ListAdminTenants {
  const { rootHost, store } = deps;

  return async (input) => {
    const rejected = rejectIfNotAdminHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    const page = normalizePage(input.page);
    const pageSize = normalizePageSize(input.pageSize);
    const listed = await store.listPaged({ page, pageSize });

    return {
      ok: true,
      schools: listed.items.map((tenant) => toTenantAdminView(tenant, rootHost)),
      page,
      pageSize,
      total: listed.total,
    };
  };
}
