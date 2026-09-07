import type { TenantStatus } from "../ports/tenant-directory-port.ts";

export type Tenant = {
  id: string;
  name: string;
  slug: string | null;
  email: string | null;
  status: TenantStatus;
  founded: string;
  createdAt: Date;
  mustChangePassword: boolean;
  lastMailAt: Date | null;
  lastMailOk: boolean | null;
  lastMailError: string | null;
  signedInAt: Date | null;
  abbreviation: string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isTenantId(id: string): boolean {
  return UUID_PATTERN.test(id);
}

export function isTenantStatus(value: string): value is TenantStatus {
  return (
    value === "pending_setup" || value === "active" || value === "suspended"
  );
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const TENANT_EMAIL_UNAVAILABLE = "This email cannot be used.";

export function normalizeTenantEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailsEqual(left: string, right: string): boolean {
  return normalizeTenantEmail(left) === normalizeTenantEmail(right);
}

export function validateTenantEmail(email: string): string | undefined {
  const normalized = normalizeTenantEmail(email);
  if (normalized.length === 0) {
    return "Email is required";
  }
  if (!EMAIL_PATTERN.test(normalized)) {
    return "A valid email is required";
  }
  return undefined;
}
