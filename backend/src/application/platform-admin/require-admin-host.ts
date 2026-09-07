import { isPlatformAdminHost } from "../../domain/platform-admin/host.ts";

export const ADMIN_HOST_ERROR = "This action is only allowed on the admin host";

export function rejectIfNotAdminHost(
  hostHeader: string,
  rootHost: string,
): { ok: false; status: 403; error: string } | undefined {
  if (!isPlatformAdminHost(hostHeader, rootHost)) {
    return { ok: false, status: 403, error: ADMIN_HOST_ERROR };
  }

  return undefined;
}
