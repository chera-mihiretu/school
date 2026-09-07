import {
  isAppHost,
  isPlatformAdminHost,
  stripHostPort,
} from "../../domain/platform-admin/host.ts";
import type { TenantDirectoryPort } from "../../domain/ports/tenant-directory-port.ts";
import type { PublicHostView } from "../../domain/public-host/view.ts";
import { isReservedSchoolSlug } from "../../domain/school-slug.ts";

export type ResolvePublicHost = (hostHeader: string) => Promise<PublicHostView>;

export function schoolMonogram(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function createResolvePublicHost(deps: {
  rootHost: string;
  tenants: TenantDirectoryPort;
}): ResolvePublicHost {
  const { rootHost, tenants } = deps;
  const root = rootHost.toLowerCase();

  return async (hostHeader: string): Promise<PublicHostView> => {
    const host = stripHostPort(hostHeader);

    if (host === root || host === `www.${root}`) {
      return { kind: "apex", host, rootHost: root };
    }

    if (isPlatformAdminHost(hostHeader, root)) {
      return { kind: "admin", host, rootHost: root };
    }

    if (isAppHost(hostHeader, root)) {
      return { kind: "app", host, rootHost: root };
    }

    const suffix = `.${root}`;
    if (!host.endsWith(suffix)) {
      return { kind: "apex", host, rootHost: root };
    }

    const label = host.slice(0, -suffix.length);
    if (
      label.length === 0 ||
      label.includes(".") ||
      isReservedSchoolSlug(label)
    ) {
      return { kind: "unknown", host, rootHost: root };
    }

    const tenant = await tenants.findBySlug(label);
    if (tenant === undefined) {
      return { kind: "unknown", host, rootHost: root };
    }

    const shared = {
      host,
      rootHost: root,
      name: tenant.name,
      slug: tenant.slug,
      founded: tenant.founded,
      monogram: schoolMonogram(tenant.name),
    };

    switch (tenant.status) {
      case "active":
        return { kind: "campus", ...shared };
      case "suspended":
        return { kind: "suspended", ...shared };
      case "pending_setup":
        return { kind: "unknown", host, rootHost: root };
      default: {
        const _never: never = tenant.status;
        return _never;
      }
    }
  };
}
