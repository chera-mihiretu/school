import "server-only";
import type { AdminApiError } from "./admin-api";
import {
  parseTenantSchool,
  parseTenantSchoolsPage,
  type TenantSchool,
  type TenantSchoolsPage,
} from "./tenants";

function backendUrl(): string {
  return process.env.BACKEND_URL ?? "http://127.0.0.1:5000";
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.length > 0) {
      return body.error;
    }
  } catch {
    // Use the status text below.
  }

  return response.statusText || "Request failed";
}

function adminHeaders(input: { token: string; host: string }): HeadersInit {
  return {
    authorization: `Bearer ${input.token}`,
    "x-school-host": input.host,
  };
}

export type CreatedTenant = TenantSchool;

export type CreatedTenantCredentials = {
  email: string;
  password: string;
  firstLoginUrl: string;
};

export type CreatedTenantResult = {
  school: TenantSchool;
  credentials: CreatedTenantCredentials;
  emailSent: boolean;
  emailError?: string;
};

export function parseCreatedTenant(value: unknown): CreatedTenant | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const school =
    "school" in record && record.school !== null && typeof record.school === "object"
      ? record.school
      : record;

  return parseTenantSchool(school);
}

function parseCredentials(value: unknown): CreatedTenantCredentials | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record.email !== "string" ||
    typeof record.password !== "string" ||
    typeof record.firstLoginUrl !== "string"
  ) {
    return undefined;
  }

  return {
    email: record.email,
    password: record.password,
    firstLoginUrl: record.firstLoginUrl,
  };
}

export function parseCreatedTenantResult(
  value: unknown,
): CreatedTenantResult | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const school = parseTenantSchool(record.school);
  const credentials = parseCredentials(record.credentials);
  if (school === undefined || credentials === undefined) {
    return undefined;
  }
  if (typeof record.emailSent !== "boolean") {
    return undefined;
  }

  return {
    school,
    credentials,
    emailSent: record.emailSent,
    ...(typeof record.emailError === "string" ? { emailError: record.emailError } : {}),
  };
}

export async function createAdminTenant(input: {
  token: string;
  host: string;
  name: string;
  email: string;
}): Promise<CreatedTenantResult | AdminApiError> {
  try {
    const response = await fetch(`${backendUrl()}/admin/tenants`, {
      method: "POST",
      headers: {
        ...adminHeaders(input),
        "content-type": "application/json",
      },
      body: JSON.stringify({ name: input.name, email: input.email }),
      cache: "no-store",
    });

    if (!response.ok) {
      return { status: response.status, error: await readError(response) };
    }

    const parsed = parseCreatedTenantResult(await response.json());
    if (parsed === undefined) {
      return { status: 502, error: "The create-school service returned an unexpected body" };
    }

    return parsed;
  } catch {
    return { status: 503, error: "Could not reach the create-school service" };
  }
}

export type TenantSchoolsList = TenantSchoolsPage & {
  error: string | null;
};

export async function listAdminTenants(input: {
  token: string;
  host: string;
  page?: number;
  pageSize?: number;
}): Promise<TenantSchoolsList> {
  const query = new URLSearchParams();
  if (input.page !== undefined) {
    query.set("page", String(input.page));
  }
  if (input.pageSize !== undefined) {
    query.set("pageSize", String(input.pageSize));
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  try {
    const response = await fetch(`${backendUrl()}/admin/tenants${suffix}`, {
      method: "GET",
      headers: adminHeaders(input),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        schools: [],
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 10,
        total: 0,
        error: await readError(response),
      };
    }

    return {
      ...parseTenantSchoolsPage(await response.json()),
      error: null,
    };
  } catch {
    return {
      schools: [],
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 10,
      total: 0,
      error: "Could not reach the tenants service",
    };
  }
}

export type UsernameLookupReason = "invalid" | "reserved" | "taken";

export type UsernameLookup =
  | { available: true; username: string }
  | { available: false; username: string; reason: UsernameLookupReason };

function parseUsernameLookup(value: unknown): UsernameLookup | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.username !== "string") {
    return undefined;
  }
  if (record.available === true) {
    return { available: true, username: record.username };
  }
  if (record.available !== false) {
    return undefined;
  }

  const reason = record.reason;
  if (reason !== "invalid" && reason !== "reserved" && reason !== "taken") {
    return undefined;
  }

  return { available: false, username: record.username, reason };
}

export async function lookupAdminTenantUsername(input: {
  token: string;
  host: string;
  slug: string;
}): Promise<UsernameLookup | AdminApiError> {
  const query = new URLSearchParams({ slug: input.slug });
  try {
    const response = await fetch(
      `${backendUrl()}/admin/tenants/username?${query.toString()}`,
      {
        method: "GET",
        headers: adminHeaders(input),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return { status: response.status, error: await readError(response) };
    }

    const parsed = parseUsernameLookup(await response.json());
    if (parsed === undefined) {
      return { status: 502, error: "Unexpected username lookup response" };
    }
    return parsed;
  } catch {
    return { status: 503, error: "Could not reach the tenants service" };
  }
}

async function postTenantStatus(input: {
  token: string;
  host: string;
  id: string;
  action: "suspend" | "reactivate";
}): Promise<CreatedTenant | AdminApiError> {
  try {
    const response = await fetch(
      `${backendUrl()}/admin/tenants/${encodeURIComponent(input.id)}/${input.action}`,
      {
        method: "POST",
        headers: adminHeaders(input),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return { status: response.status, error: await readError(response) };
    }

    const parsed = parseCreatedTenant(await response.json());
    if (parsed === undefined) {
      return { status: 502, error: "Unexpected tenant response" };
    }
    return parsed;
  } catch {
    return { status: 503, error: "Could not reach the tenants service" };
  }
}

export async function suspendAdminTenant(input: {
  token: string;
  host: string;
  id: string;
}): Promise<CreatedTenant | AdminApiError> {
  return postTenantStatus({ ...input, action: "suspend" });
}

export async function reactivateAdminTenant(input: {
  token: string;
  host: string;
  id: string;
}): Promise<CreatedTenant | AdminApiError> {
  return postTenantStatus({ ...input, action: "reactivate" });
}

export async function resendAdminTenantCredentials(input: {
  token: string;
  host: string;
  id: string;
}): Promise<CreatedTenantResult | AdminApiError> {
  try {
    const response = await fetch(
      `${backendUrl()}/admin/tenants/${encodeURIComponent(input.id)}/resend-credentials`,
      {
        method: "POST",
        headers: adminHeaders(input),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return { status: response.status, error: await readError(response) };
    }

    const parsed = parseCreatedTenantResult(await response.json());
    if (parsed === undefined) {
      return { status: 502, error: "The resend-credentials service returned an unexpected body" };
    }

    return parsed;
  } catch {
    return { status: 503, error: "Could not reach the tenants service" };
  }
}
