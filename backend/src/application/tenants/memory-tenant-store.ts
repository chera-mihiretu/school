import { randomUUID } from "node:crypto";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import type { DashboardStats } from "../../domain/tenants/dashboard-stats.ts";
import {
  backfillDashboardStats,
  recordSchoolCreated,
  recordStatusChange,
} from "../../domain/tenants/dashboard-stats.ts";
import { normalizeTenantEmail, type Tenant } from "../../domain/tenants/tenant.ts";

type TenantRow = Tenant & { passwordHash: string | null };

function toTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    email: row.email,
    status: row.status,
    founded: row.founded,
    createdAt: row.createdAt,
    mustChangePassword: row.mustChangePassword,
    lastMailAt: row.lastMailAt,
    lastMailOk: row.lastMailOk,
    lastMailError: row.lastMailError,
    signedInAt: row.signedInAt,
    abbreviation: row.abbreviation,
  };
}

function toAuth(row: TenantRow | undefined) {
  if (row === undefined || row.passwordHash === null) {
    return undefined;
  }
  return { tenant: toTenant(row), passwordHash: row.passwordHash };
}

export function createMemoryTenantStore(seed: Tenant[] = []): TenantStorePort {
  const rows: TenantRow[] = seed.map((tenant) => ({
    ...tenant,
    passwordHash: null,
  }));
  let stats: DashboardStats | undefined;

  function tenants(): Tenant[] {
    return rows.map(toTenant);
  }

  function ensureStats(now = new Date()): DashboardStats {
    if (stats === undefined) {
      stats = backfillDashboardStats(tenants(), now);
    }
    return stats;
  }

  return {
    async ensureSchema() {
      ensureStats();
    },
    async insert(input) {
      if (rows.some((row) => row.slug === input.slug)) {
        return { ok: false, reason: "slug_taken" };
      }
      const currentStats = ensureStats();
      const tenant: TenantRow = {
        id: randomUUID(),
        name: input.name,
        slug: input.slug,
        email: null,
        status: "active",
        founded: input.founded,
        createdAt: new Date("2026-09-06T12:00:00.000Z"),
        mustChangePassword: false,
        lastMailAt: null,
        lastMailOk: null,
        lastMailError: null,
        signedInAt: null,
        abbreviation: null,
        passwordHash: null,
      };
      rows.push(tenant);
      stats = recordSchoolCreated(currentStats, toTenant(tenant), new Date());
      return { ok: true, tenant: toTenant(tenant) };
    },
    async insertPending(input) {
      const email = normalizeTenantEmail(input.email);
      if (rows.some((row) => row.email === email)) {
        return { ok: false, reason: "email_taken" };
      }
      const currentStats = ensureStats();
      const tenant: TenantRow = {
        id: randomUUID(),
        name: input.name,
        slug: null,
        email,
        status: "pending_setup",
        founded: input.founded,
        createdAt: new Date("2026-09-06T12:00:00.000Z"),
        mustChangePassword: true,
        lastMailAt: null,
        lastMailOk: null,
        lastMailError: null,
        signedInAt: null,
        abbreviation: null,
        passwordHash: input.passwordHash,
      };
      rows.push(tenant);
      stats = recordSchoolCreated(currentStats, toTenant(tenant), new Date());
      return { ok: true, tenant: toTenant(tenant) };
    },
    async findBySlug(slug) {
      const row = rows.find((item) => item.slug !== null && item.slug === slug);
      return row === undefined ? undefined : toTenant(row);
    },
    async findByEmail(email) {
      const normalized = normalizeTenantEmail(email);
      const row = rows.find((item) => item.email === normalized);
      return row === undefined ? undefined : toTenant(row);
    },
    async findAuthByEmail(email) {
      const normalized = normalizeTenantEmail(email);
      const row = rows.find((item) => item.email === normalized);
      return toAuth(row);
    },
    async findAuthById(id) {
      const row = rows.find((item) => item.id === id);
      return toAuth(row);
    },
    async updatePassword(input) {
      const tenant = rows.find((row) => row.id === input.id);
      if (tenant === undefined) {
        return { ok: false, reason: "not_found" };
      }
      tenant.passwordHash = input.passwordHash;
      tenant.mustChangePassword = input.mustChangePassword;
      return { ok: true, tenant: toTenant(tenant) };
    },
    async claimSlug(input) {
      const tenant = rows.find((row) => row.id === input.id);
      if (tenant === undefined) {
        return { ok: false, reason: "not_found" };
      }
      if (tenant.slug !== null) {
        return { ok: false, reason: "already_claimed" };
      }
      if (rows.some((row) => row.slug === input.slug)) {
        return { ok: false, reason: "slug_taken" };
      }
      const currentStats = ensureStats();
      const from = tenant.status;
      tenant.slug = input.slug;
      tenant.status = "active";
      const updated = toTenant(tenant);
      stats = recordStatusChange(currentStats, updated, from, new Date());
      return { ok: true, tenant: updated };
    },
    async listPaged(input) {
      const sorted = [...rows].sort((left, right) => {
        const created = right.createdAt.getTime() - left.createdAt.getTime();
        if (created !== 0) {
          return created;
        }
        return right.id.localeCompare(left.id);
      });
      const start = (input.page - 1) * input.pageSize;
      return {
        items: sorted.slice(start, start + input.pageSize).map(toTenant),
        total: sorted.length,
      };
    },
    async setStatus(id, status) {
      const tenant = rows.find((row) => row.id === id);
      if (tenant === undefined) {
        return { ok: false, reason: "not_found" };
      }
      const currentStats = ensureStats();
      const from = tenant.status;
      tenant.status = status;
      const updated = toTenant(tenant);
      stats = recordStatusChange(currentStats, updated, from, new Date());
      return { ok: true, tenant: updated };
    },
    async recordMailAttempt(id, input) {
      const tenant = rows.find((row) => row.id === id);
      if (tenant === undefined) {
        return { ok: false, reason: "not_found" };
      }
      tenant.lastMailAt = input.at;
      tenant.lastMailOk = input.ok;
      tenant.lastMailError = input.ok ? null : (input.error ?? "Failed to send email");
      return { ok: true, tenant: toTenant(tenant) };
    },
    async listAbbreviations() {
      return rows.flatMap((row) =>
        row.abbreviation === null ? [] : [row.abbreviation],
      );
    },
    async claimAbbreviation(input) {
      const tenant = rows.find((row) => row.id === input.id);
      if (tenant === undefined) {
        return { ok: false, reason: "not_found" };
      }
      if (tenant.abbreviation !== null) {
        return { ok: false, reason: "already_set" };
      }
      const wanted = input.abbreviation;
      if (
        rows.some(
          (row) =>
            row.abbreviation !== null &&
            row.abbreviation === wanted,
        )
      ) {
        return { ok: false, reason: "taken" };
      }
      tenant.abbreviation = wanted;
      return { ok: true, tenant: toTenant(tenant) };
    },
    async recordDirectorSignIn(id, at) {
      const tenant = rows.find((row) => row.id === id);
      if (tenant === undefined) {
        return { ok: false, reason: "not_found" };
      }
      if (tenant.signedInAt === null) {
        tenant.signedInAt = at;
      }
      return { ok: true, tenant: toTenant(tenant) };
    },
    async readDashboardStats() {
      return ensureStats();
    },
  };
}
