import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import {
  servingPercent,
  type DashboardNewestSchool,
} from "../../domain/tenants/dashboard-stats.ts";
import { rejectIfNotAdminHost } from "../platform-admin/require-admin-host.ts";

export type AdminDashboardView = {
  schoolCount: number;
  activeCount: number;
  pendingSetupCount: number;
  suspendedCount: number;
  servingPercent: number;
  createdByYear: Record<string, number>;
  newest: DashboardNewestSchool[];
};

export type GetAdminDashboardInput = {
  hostHeader: string;
};

export type GetAdminDashboardResult =
  | ({ ok: true } & AdminDashboardView)
  | { ok: false; status: 403; error: string };

export type GetAdminDashboard = (
  input: GetAdminDashboardInput,
) => Promise<GetAdminDashboardResult>;

export function createGetAdminDashboard(deps: {
  rootHost: string;
  store: TenantStorePort;
}): GetAdminDashboard {
  const { rootHost, store } = deps;

  return async (input) => {
    const rejected = rejectIfNotAdminHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    const stats = await store.readDashboardStats();
    return {
      ok: true,
      schoolCount: stats.schoolCount,
      activeCount: stats.activeCount,
      pendingSetupCount: stats.pendingSetupCount,
      suspendedCount: stats.suspendedCount,
      servingPercent: servingPercent(stats.activeCount, stats.schoolCount),
      createdByYear: stats.createdByYear,
      newest: stats.newest,
    };
  };
}
