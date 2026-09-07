import type { TenantStatus } from "../../domain/ports/tenant-directory-port.ts";
import type { Tenant } from "../../domain/tenants/tenant.ts";

export type TenantAdminView = {
  id: string;
  name: string;
  slug: string | null;
  username: string | null;
  email: string | null;
  status: TenantStatus;
  created: string;
  founded: string;
  host: string | null;
  mustChangePassword: boolean;
  lastMailAt: string | null;
  lastMailOk: boolean | null;
  lastMailError: string | null;
  signedInAt: string | null;
};

export function toTenantAdminView(
  tenant: Tenant,
  rootHost: string,
): TenantAdminView {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    username: tenant.slug,
    email: tenant.email,
    status: tenant.status,
    created: tenant.createdAt.toISOString(),
    founded: tenant.founded,
    host: tenant.slug === null ? null : `${tenant.slug}.${rootHost}`,
    mustChangePassword: tenant.mustChangePassword,
    lastMailAt: tenant.lastMailAt === null ? null : tenant.lastMailAt.toISOString(),
    lastMailOk: tenant.lastMailOk,
    lastMailError: tenant.lastMailError,
    signedInAt: tenant.signedInAt === null ? null : tenant.signedInAt.toISOString(),
  };
}
