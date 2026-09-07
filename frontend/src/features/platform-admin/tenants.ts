export const DIRECTOR_EMAIL_UNAVAILABLE = "This email cannot be used.";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateDirectorEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return "Email is required.";
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "A valid email is required.";
  }
  return undefined;
}

export type TenantStatus = "pending_setup" | "active" | "suspended";

export type TenantSchool = {
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

export type TenantSchoolsPage = {
  schools: TenantSchool[];
  page: number;
  pageSize: number;
  total: number;
};

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }
  return value;
}

function readNullableString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  return readString(record, key) ?? null;
}

function parseStatus(value: unknown): TenantStatus | undefined {
  if (value === "pending_setup" || value === "active" || value === "suspended") {
    return value;
  }
  return undefined;
}

export function parseTenantSchool(value: unknown): TenantSchool | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const id = record.id;
  const name = readString(record, "name");
  const status = parseStatus(record.status);
  if (name === undefined || status === undefined) {
    return undefined;
  }
  if (typeof id !== "string" && typeof id !== "number") {
    return undefined;
  }

  const slug = readNullableString(record, "slug");
  const email = readNullableString(record, "email");
  const username = readNullableString(record, "username") ?? slug;
  const host = readNullableString(record, "host");
  return {
    id: String(id),
    name,
    slug,
    username,
    email,
    status,
    created: typeof record.created === "string" ? record.created : "",
    founded: typeof record.founded === "string" ? record.founded : "",
    host,
    mustChangePassword: record.mustChangePassword === true,
    lastMailAt: typeof record.lastMailAt === "string" ? record.lastMailAt : null,
    lastMailOk: typeof record.lastMailOk === "boolean" ? record.lastMailOk : null,
    lastMailError:
      typeof record.lastMailError === "string" ? record.lastMailError : null,
    signedInAt: typeof record.signedInAt === "string" ? record.signedInAt : null,
  };
}

export function parseTenantSchoolsPage(value: unknown): TenantSchoolsPage {
  if (value === null || typeof value !== "object") {
    return { schools: [], page: 1, pageSize: 10, total: 0 };
  }

  const record = value as Record<string, unknown>;
  const schools = Array.isArray(record.schools)
    ? record.schools.flatMap((item) => {
        const school = parseTenantSchool(item);
        return school === undefined ? [] : [school];
      })
    : [];

  return {
    schools,
    page: readPositiveInt(record.page, 1),
    pageSize: readPositiveInt(record.pageSize, 10),
    total: readNonNegativeInt(record.total, schools.length),
  };
}

export function tenantSchoolAddress(
  school: Pick<TenantSchool, "host" | "slug" | "email">,
  rootHost: string,
): string {
  if (school.host !== null && school.host.length > 0) {
    return school.host;
  }
  if (school.slug !== null && school.slug.length > 0) {
    return `${school.slug}.${rootHost}`;
  }
  if (school.email !== null && school.email.length > 0) {
    return school.email;
  }
  return "Setup pending";
}

export function canResendTenantCredentials(
  school: Pick<TenantSchool, "slug" | "status">,
): boolean {
  return school.slug === null && school.status !== "suspended";
}

export function tenantMailStatusCopy(
  school: Pick<TenantSchool, "signedInAt" | "lastMailOk" | "lastMailError">,
): string {
  if (school.signedInAt !== null) {
    return "Director signed in";
  }
  if (school.lastMailOk === true) {
    return "SMTP accepted — not proof of inbox";
  }
  if (school.lastMailOk === false) {
    const error = school.lastMailError;
    return error !== null && error.length > 0
      ? `Send failed: ${error}`
      : "Send failed";
  }
  return "Not sent";
}

function readPositiveInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 1) {
    return Math.trunc(value);
  }
  return fallback;
}

function readNonNegativeInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.trunc(value);
  }
  return fallback;
}
