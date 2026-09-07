import { isAppHost } from "../../domain/platform-admin/host.ts";

export const APP_HOST_ERROR = "School accounts are only allowed on the app host";

export function rejectIfNotAppHost(
  hostHeader: string,
  rootHost: string,
): { ok: false; status: 403; error: string } | undefined {
  if (!isAppHost(hostHeader, rootHost)) {
    return { ok: false, status: 403, error: APP_HOST_ERROR };
  }

  return undefined;
}
