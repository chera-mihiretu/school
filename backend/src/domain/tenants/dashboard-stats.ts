import type { TenantStatus } from "../ports/tenant-directory-port.ts";
import type { Tenant } from "./tenant.ts";

export type DashboardNewestSchool = {
  id: string;
  name: string;
  slug: string | null;
  email: string | null;
  status: TenantStatus;
  created: string;
};

export type DashboardStats = {
  schoolCount: number;
  activeCount: number;
  pendingSetupCount: number;
  suspendedCount: number;
  createdByYear: Record<string, number>;
  newest: DashboardNewestSchool[];
  updatedAt: Date;
};

const NEWEST_LIMIT = 3;

export function servingPercent(active: number, total: number): number {
  return total === 0 ? 0 : Math.round((active / total) * 100);
}

export function emptyDashboardStats(now: Date): DashboardStats {
  return {
    schoolCount: 0,
    activeCount: 0,
    pendingSetupCount: 0,
    suspendedCount: 0,
    createdByYear: {},
    newest: [],
    updatedAt: now,
  };
}

export function toNewestSchool(tenant: Tenant): DashboardNewestSchool {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    email: tenant.email,
    status: tenant.status,
    created: tenant.createdAt.toISOString(),
  };
}

export function backfillDashboardStats(
  tenants: readonly Tenant[],
  now: Date,
): DashboardStats {
  const createdByYear: Record<string, number> = {};
  let activeCount = 0;
  let pendingSetupCount = 0;
  let suspendedCount = 0;

  for (const tenant of tenants) {
    switch (tenant.status) {
      case "active":
        activeCount += 1;
        break;
      case "pending_setup":
        pendingSetupCount += 1;
        break;
      case "suspended":
        suspendedCount += 1;
        break;
      default: {
        const _never: never = tenant.status;
        throw new Error(`unexpected tenant status: ${String(_never)}`);
      }
    }

    const year = yearKey(tenant.createdAt);
    createdByYear[year] = (createdByYear[year] ?? 0) + 1;
  }

  const newest = [...tenants]
    .sort((left, right) => {
      const created = right.createdAt.getTime() - left.createdAt.getTime();
      if (created !== 0) {
        return created;
      }
      return right.id.localeCompare(left.id);
    })
    .slice(0, NEWEST_LIMIT)
    .map(toNewestSchool);

  return {
    schoolCount: tenants.length,
    activeCount,
    pendingSetupCount,
    suspendedCount,
    createdByYear,
    newest,
    updatedAt: now,
  };
}

export function recordSchoolCreated(
  stats: DashboardStats,
  tenant: Tenant,
  now: Date,
): DashboardStats {
  const year = yearKey(tenant.createdAt);
  return {
    ...adjustStatusCount(stats, tenant.status, 1),
    schoolCount: stats.schoolCount + 1,
    createdByYear: {
      ...stats.createdByYear,
      [year]: (stats.createdByYear[year] ?? 0) + 1,
    },
    newest: prependNewest(stats.newest, toNewestSchool(tenant)),
    updatedAt: now,
  };
}

export function recordStatusChange(
  stats: DashboardStats,
  tenant: Tenant,
  from: TenantStatus,
  now: Date,
): DashboardStats {
  const shifted =
    from === tenant.status
      ? stats
      : adjustStatusCount(adjustStatusCount(stats, from, -1), tenant.status, 1);

  return {
    ...shifted,
    newest: patchNewest(stats.newest, tenant),
    updatedAt: now,
  };
}

function yearKey(createdAt: Date): string {
  return String(createdAt.getUTCFullYear());
}

function statusCountKey(
  status: TenantStatus,
): "activeCount" | "pendingSetupCount" | "suspendedCount" {
  switch (status) {
    case "active":
      return "activeCount";
    case "pending_setup":
      return "pendingSetupCount";
    case "suspended":
      return "suspendedCount";
    default: {
      const _never: never = status;
      return _never;
    }
  }
}

function adjustStatusCount(
  stats: DashboardStats,
  status: TenantStatus,
  delta: number,
): DashboardStats {
  const key = statusCountKey(status);
  return {
    ...stats,
    [key]: stats[key] + delta,
  };
}

function prependNewest(
  newest: DashboardNewestSchool[],
  school: DashboardNewestSchool,
): DashboardNewestSchool[] {
  return [school, ...newest.filter((item) => item.id !== school.id)].slice(
    0,
    NEWEST_LIMIT,
  );
}

function patchNewest(
  newest: DashboardNewestSchool[],
  tenant: Tenant,
): DashboardNewestSchool[] {
  return newest.map((item) =>
    item.id === tenant.id ? toNewestSchool(tenant) : item,
  );
}
