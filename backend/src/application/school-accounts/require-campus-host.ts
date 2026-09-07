import {
  isAppHost,
  isPlatformAdminHost,
  stripHostPort,
} from "../../domain/platform-admin/host.ts";
import { isReservedSchoolSlug } from "../../domain/school-slug.ts";

export const CAMPUS_HOST_ERROR =
  "Campus login is only allowed on that school's host";

export function campusSlugFromHost(
  hostHeader: string,
  rootHost: string,
): string | undefined {
  if (isPlatformAdminHost(hostHeader, rootHost) || isAppHost(hostHeader, rootHost)) {
    return undefined;
  }

  const host = stripHostPort(hostHeader);
  const root = rootHost.toLowerCase();
  const suffix = `.${root}`;
  if (!host.endsWith(suffix)) {
    return undefined;
  }

  const label = host.slice(0, -suffix.length);
  if (label.length === 0 || label.includes(".") || isReservedSchoolSlug(label)) {
    return undefined;
  }

  return label;
}

export function rejectIfNotCampusHost(
  hostHeader: string,
  rootHost: string,
): { ok: false; status: 403; error: string } | undefined {
  if (campusSlugFromHost(hostHeader, rootHost) === undefined) {
    return { ok: false, status: 403, error: CAMPUS_HOST_ERROR };
  }

  return undefined;
}
