export const DEFAULT_ROOT_HOST = "e-school.et";

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "app",
  "admin",
  "mail",
  "ftp",
]);

export type SchoolHost = {
  hostname: string;
  rootHost: string;
  subdomain: string | null;
  isApex: boolean;
};

export function getRootHost(): string {
  return stripHostPort(process.env.APP_HOST ?? DEFAULT_ROOT_HOST);
}

export function formatTenantName(slug: string): string {
  return slug
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function stripHostPort(hostHeader: string): string {
  const trimmed = hostHeader.trim().toLowerCase();

  if (trimmed.startsWith("[")) {
    const end = trimmed.indexOf("]");
    if (end !== -1) {
      return trimmed.slice(1, end);
    }
  }

  const colon = trimmed.lastIndexOf(":");
  if (colon !== -1 && /^\d+$/.test(trimmed.slice(colon + 1))) {
    return trimmed.slice(0, colon);
  }

  return trimmed;
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SUBDOMAINS.has(slug.toLowerCase());
}

export function isPlatformAdminHost(
  hostHeader: string,
  rootHost = getRootHost(),
): boolean {
  return stripHostPort(hostHeader) === `admin.${rootHost.toLowerCase()}`;
}

export function isAppHost(
  hostHeader: string,
  rootHost = getRootHost(),
): boolean {
  return stripHostPort(hostHeader) === `app.${rootHost.toLowerCase()}`;
}

export function parseSchoolHost(
  hostHeader: string,
  rootHost = getRootHost(),
): SchoolHost {
  const hostname = stripHostPort(hostHeader);
  const root = rootHost.toLowerCase();

  if (hostname === root || hostname === `www.${root}`) {
    return {
      hostname,
      rootHost: root,
      subdomain: null,
      isApex: true,
    };
  }

  const suffix = `.${root}`;
  if (hostname.endsWith(suffix)) {
    const label = hostname.slice(0, -suffix.length);
    if (label.length > 0 && !label.includes(".") && !RESERVED_SUBDOMAINS.has(label)) {
      return {
        hostname,
        rootHost: root,
        subdomain: label,
        isApex: false,
      };
    }
  }

  return {
    hostname,
    rootHost: root,
    subdomain: null,
    isApex: hostname === root,
  };
}
