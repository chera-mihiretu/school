export const DEFAULT_PUBLIC_PROTOCOL = "http";
export const DEFAULT_PUBLIC_HOST = "e-school.et:3000";
export const DEFAULT_PUBLIC_PORT = "3000";

export type PublicUrlLabel = "admin" | "app" | string;

export type PublicUrlOptions = {
  label?: PublicUrlLabel;
  path?: string;
};

export type PublicUrlParts = {
  protocol: string;
  host: string;
};

export function normalizeProtocol(raw: string): string {
  const trimmed = raw.trim().toLowerCase().replace(/:\/\/$/, "");
  return trimmed.length > 0 ? trimmed : DEFAULT_PUBLIC_PROTOCOL;
}

function stripPublicHostPort(host: string): string {
  const trimmed = host.trim().toLowerCase();
  const colon = trimmed.lastIndexOf(":");
  if (colon !== -1 && /^\d+$/.test(trimmed.slice(colon + 1))) {
    return trimmed.slice(0, colon);
  }
  return trimmed;
}

export function normalizePublicHost(rawHost: string): string {
  const trimmed = rawHost.trim().toLowerCase();
  const hostname = stripPublicHostPort(trimmed);
  if (hostname.length === 0) {
    return DEFAULT_PUBLIC_HOST;
  }
  if (trimmed === hostname) {
    return `${hostname}:${DEFAULT_PUBLIC_PORT}`;
  }
  return trimmed;
}

export function rootHostFromAppHost(rawHost: string): string {
  return stripPublicHostPort(normalizePublicHost(rawHost));
}

export function readPublicUrlParts(
  env: NodeJS.ProcessEnv = process.env,
): PublicUrlParts {
  return {
    protocol: normalizeProtocol(env.APP_PROTOCOL ?? DEFAULT_PUBLIC_PROTOCOL),
    host: normalizePublicHost(env.APP_HOST ?? DEFAULT_PUBLIC_HOST),
  };
}

export function createPublicUrl(
  parts: PublicUrlParts,
): (options?: PublicUrlOptions) => string {
  const protocol = normalizeProtocol(parts.protocol);
  const host = normalizePublicHost(parts.host);

  return function publicUrl(options: PublicUrlOptions = {}): string {
    const label = options.label?.trim();
    const authority =
      label === undefined || label.length === 0 ? host : `${label}.${host}`;
    return `${protocol}://${authority}${normalizePublicPath(options.path)}`;
  };
}

export function publicUrl(
  options: PublicUrlOptions = {},
  parts: PublicUrlParts = readPublicUrlParts(),
): string {
  return createPublicUrl(parts)(options);
}

function normalizePublicPath(path?: string): string {
  if (path === undefined) {
    return "";
  }
  const trimmed = path.trim();
  if (trimmed.length === 0) {
    return "";
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
