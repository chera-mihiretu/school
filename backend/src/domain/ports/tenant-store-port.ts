import type { TenantStatus } from "./tenant-directory-port.ts";
import type { DashboardStats } from "../tenants/dashboard-stats.ts";
import type { Tenant } from "../tenants/tenant.ts";

export type TenantInsertResult =
  | { ok: true; tenant: Tenant }
  | { ok: false; reason: "slug_taken" };

export type TenantInsertPendingResult =
  | { ok: true; tenant: Tenant }
  | { ok: false; reason: "email_taken" };

export type TenantUpdatePasswordResult =
  | { ok: true; tenant: Tenant }
  | { ok: false; reason: "not_found" };

export type TenantClaimSlugResult =
  | { ok: true; tenant: Tenant }
  | { ok: false; reason: "not_found" | "slug_taken" | "already_claimed" };

export type TenantClaimAbbreviationResult =
  | { ok: true; tenant: Tenant }
  | { ok: false; reason: "not_found" | "already_set" | "taken" };

export type TenantPage = {
  items: Tenant[];
  total: number;
};

export type TenantSetStatusResult =
  | { ok: true; tenant: Tenant }
  | { ok: false; reason: "not_found" };

export type TenantRecordMailResult =
  | { ok: true; tenant: Tenant }
  | { ok: false; reason: "not_found" };

export type TenantRecordSignInResult =
  | { ok: true; tenant: Tenant }
  | { ok: false; reason: "not_found" };

export type TenantMailAttempt = {
  ok: boolean;
  error?: string;
  at: Date;
};

export type TenantAuth = {
  tenant: Tenant;
  passwordHash: string;
};

export type TenantStorePort = {
  ensureSchema: () => Promise<void>;
  insert: (input: {
    name: string;
    slug: string;
    founded: string;
  }) => Promise<TenantInsertResult>;
  insertPending: (input: {
    name: string;
    email: string;
    passwordHash: string;
    founded: string;
  }) => Promise<TenantInsertPendingResult>;
  findBySlug: (slug: string) => Promise<Tenant | undefined>;
  findByEmail: (email: string) => Promise<Tenant | undefined>;
  findAuthByEmail: (email: string) => Promise<TenantAuth | undefined>;
  findAuthById: (id: string) => Promise<TenantAuth | undefined>;
  updatePassword: (input: {
    id: string;
    passwordHash: string;
    mustChangePassword: boolean;
  }) => Promise<TenantUpdatePasswordResult>;
  claimSlug: (input: {
    id: string;
    slug: string;
  }) => Promise<TenantClaimSlugResult>;
  listAbbreviations: () => Promise<string[]>;
  claimAbbreviation: (input: {
    id: string;
    abbreviation: string;
  }) => Promise<TenantClaimAbbreviationResult>;
  listPaged: (input: { page: number; pageSize: number }) => Promise<TenantPage>;
  setStatus: (id: string, status: TenantStatus) => Promise<TenantSetStatusResult>;
  recordMailAttempt: (
    id: string,
    input: TenantMailAttempt,
  ) => Promise<TenantRecordMailResult>;
  recordDirectorSignIn: (
    id: string,
    at: Date,
  ) => Promise<TenantRecordSignInResult>;
  readDashboardStats: () => Promise<DashboardStats>;
};
