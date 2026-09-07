export const RESERVED_SCHOOL_SLUGS = [
  "www",
  "api",
  "app",
  "admin",
  "mail",
  "ftp",
] as const;

const SCHOOL_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const MAX_SCHOOL_NAME_LENGTH = 200;

export function isValidSchoolSlug(slug: string): boolean {
  return SCHOOL_SLUG_PATTERN.test(slug);
}

export function isReservedSchoolSlug(slug: string): boolean {
  return (RESERVED_SCHOOL_SLUGS as readonly string[]).includes(
    slug.toLowerCase(),
  );
}

export function normalizeSchoolSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function normalizeSchoolName(name: string): string {
  return name.trim();
}

export function validateSchoolSlug(slug: string): string | undefined {
  const normalized = normalizeSchoolSlug(slug);
  if (normalized.length === 0) {
    return "A subdomain slug is required";
  }

  if (!isValidSchoolSlug(normalized)) {
    return "Invalid slug: use lowercase letters, numbers and single hyphens, starting and ending with a letter or number";
  }

  if (isReservedSchoolSlug(normalized)) {
    return `"${normalized}" is reserved by the platform`;
  }

  return undefined;
}

export function validateSchoolName(name: string): string | undefined {
  const normalized = normalizeSchoolName(name);
  if (normalized.length === 0) {
    return "A school name is required";
  }

  if (normalized.length > MAX_SCHOOL_NAME_LENGTH) {
    return "School name is too long";
  }

  return undefined;
}

export function tenantSchemaName(slug: string): string {
  return `tenant_${normalizeSchoolSlug(slug).replace(/-/g, "_")}`;
}
