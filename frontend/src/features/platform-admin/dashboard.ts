import type { TenantStatus } from "./tenants";

export type DashboardNewestSchool = {
  id: string;
  name: string;
  slug: string | null;
  email: string | null;
  status: TenantStatus;
  created: string;
};

export type AdminDashboardStats = {
  schoolCount: number;
  activeCount: number;
  pendingSetupCount: number;
  suspendedCount: number;
  servingPercent: number;
  createdByYear: Record<string, number>;
  newest: DashboardNewestSchool[];
};

export const EMPTY_ADMIN_DASHBOARD: AdminDashboardStats = {
  schoolCount: 0,
  activeCount: 0,
  pendingSetupCount: 0,
  suspendedCount: 0,
  servingPercent: 0,
  createdByYear: {},
  newest: [],
};

function readNonNegativeInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.trunc(value);
  }
  return fallback;
}

function parseStatus(value: unknown): TenantStatus | undefined {
  if (value === "pending_setup" || value === "active" || value === "suspended") {
    return value;
  }
  return undefined;
}

export function parseNewestSchool(value: unknown): DashboardNewestSchool | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const status = parseStatus(record.status);
  if (typeof record.id !== "string" || typeof record.name !== "string" || status === undefined) {
    return undefined;
  }

  return {
    id: record.id,
    name: record.name,
    slug: typeof record.slug === "string" ? record.slug : null,
    email: typeof record.email === "string" ? record.email : null,
    status,
    created: typeof record.created === "string" ? record.created : "",
  };
}

export function parseAdminDashboardStats(value: unknown): AdminDashboardStats {
  if (value === null || typeof value !== "object") {
    return { ...EMPTY_ADMIN_DASHBOARD };
  }

  const record = value as Record<string, unknown>;
  const createdByYear: Record<string, number> = {};
  if (record.createdByYear !== null && typeof record.createdByYear === "object") {
    for (const [year, count] of Object.entries(
      record.createdByYear as Record<string, unknown>,
    )) {
      if (typeof count === "number" && Number.isFinite(count) && count >= 0) {
        createdByYear[year] = Math.trunc(count);
      }
    }
  }

  const newest = Array.isArray(record.newest)
    ? record.newest.flatMap((item) => {
        const school = parseNewestSchool(item);
        return school === undefined ? [] : [school];
      })
    : [];

  const schoolCount = readNonNegativeInt(record.schoolCount, 0);
  const activeCount = readNonNegativeInt(record.activeCount, 0);

  return {
    schoolCount,
    activeCount,
    pendingSetupCount: readNonNegativeInt(record.pendingSetupCount, 0),
    suspendedCount: readNonNegativeInt(record.suspendedCount, 0),
    servingPercent: readNonNegativeInt(record.servingPercent, 0),
    createdByYear,
    newest,
  };
}

export function displayDashboardDate(created: string): string {
  if (created.length >= 10 && created[4] === "-" && created[7] === "-") {
    return created.slice(0, 10);
  }
  return created;
}
