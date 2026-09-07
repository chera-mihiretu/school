export type TenantStatus = "pending_setup" | "active" | "suspended";

export type NetworkSchool = {
  id: string;
  name: string;
  slug: string | null;
  email?: string | null;
  created: string;
  status: TenantStatus;
  founded: string;
};

export const DEMO_NETWORK: NetworkSchool[] = [];

export type PublicSchoolView =
  | { kind: "apex"; host: string; rootHost: string }
  | { kind: "admin"; host: string; rootHost: string }
  | { kind: "app"; host: string; rootHost: string }
  | {
      kind: "campus";
      host: string;
      rootHost: string;
      name: string;
      slug: string;
      founded: string;
      monogram: string;
    }
  | { kind: "unknown"; host: string; rootHost: string }
  | {
      kind: "suspended";
      host: string;
      rootHost: string;
      name: string;
      slug: string;
      monogram: string;
    };

export function schoolMonogram(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function slugifySchoolName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidSchoolSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug);
}

export function schoolHost(slug: string, rootHost: string): string {
  return `${slug}.${rootHost}`;
}

export function schoolHostLabel(
  slug: string | null,
  rootHost: string,
): string | null {
  if (slug === null || slug.length === 0) {
    return null;
  }
  return schoolHost(slug, rootHost);
}

export function resolvePublicSchoolView(input: {
  hostname: string;
  rootHost: string;
  subdomain: string | null;
  isApex: boolean;
  schools?: readonly NetworkSchool[];
}): PublicSchoolView {
  const schools = input.schools ?? DEMO_NETWORK;
  const host = input.hostname;
  const rootHost = input.rootHost;

  if (input.isApex) {
    return { kind: "apex", host, rootHost };
  }

  if (host === `admin.${rootHost}`) {
    return { kind: "admin", host, rootHost };
  }

  if (host === `app.${rootHost}`) {
    return { kind: "app", host, rootHost };
  }

  if (input.subdomain === null) {
    if (host === rootHost || host.endsWith(`.${rootHost}`)) {
      return { kind: "unknown", host, rootHost };
    }
    return { kind: "apex", host, rootHost };
  }

  const school = schools.find(
    (item) => item.slug !== null && item.slug === input.subdomain,
  );
  if (school === undefined || school.slug === null) {
    return { kind: "unknown", host, rootHost };
  }

  switch (school.status) {
    case "active":
      return {
        kind: "campus",
        host,
        rootHost,
        name: school.name,
        slug: school.slug,
        founded: school.founded,
        monogram: schoolMonogram(school.name),
      };
    case "suspended":
      return {
        kind: "suspended",
        host,
        rootHost,
        name: school.name,
        slug: school.slug,
        monogram: schoolMonogram(school.name),
      };
    case "pending_setup":
      return { kind: "unknown", host, rootHost };
    default: {
      const _never: never = school.status;
      return _never;
    }
  }
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }
  return value;
}

function parseNamedCampus(
  record: Record<string, unknown>,
  kind: "campus" | "suspended",
): PublicSchoolView | undefined {
  const host = readString(record, "host");
  const rootHost = readString(record, "rootHost");
  const name = readString(record, "name");
  const slug = readString(record, "slug");
  const founded = readString(record, "founded");
  const monogram = readString(record, "monogram");
  if (
    host === undefined ||
    rootHost === undefined ||
    name === undefined ||
    slug === undefined ||
    founded === undefined ||
    monogram === undefined
  ) {
    return undefined;
  }

  return { kind, host, rootHost, name, slug, founded, monogram };
}

export function parsePublicSchoolView(value: unknown): PublicSchoolView | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const kind = record.kind;
  const host = readString(record, "host");
  const rootHost = readString(record, "rootHost");
  if (host === undefined || rootHost === undefined) {
    return undefined;
  }

  switch (kind) {
    case "apex":
    case "admin":
    case "app":
    case "unknown":
      return { kind, host, rootHost };
    case "campus":
      return parseNamedCampus(record, "campus");
    case "suspended":
      return parseNamedCampus(record, "suspended");
    default:
      return undefined;
  }
}
