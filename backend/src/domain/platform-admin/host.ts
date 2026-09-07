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

export function isPlatformAdminHost(
  hostHeader: string,
  rootHost: string,
): boolean {
  return stripHostPort(hostHeader) === `admin.${rootHost.toLowerCase()}`;
}

export function isAppHost(hostHeader: string, rootHost: string): boolean {
  return stripHostPort(hostHeader) === `app.${rootHost.toLowerCase()}`;
}
