import { isFeaturedSchoolId } from "../../domain/featured-schools/featured-school.ts";
import type { FeaturedSchoolStorePort } from "../../domain/ports/featured-school-store-port.ts";
import { rejectIfNotAdminHost } from "../platform-admin/require-admin-host.ts";

export type DeleteFeaturedSchoolInput = {
  hostHeader: string;
  id: string;
};

export type DeleteFeaturedSchoolResult =
  | { ok: true }
  | { ok: false; status: 403 | 404; error: string };

export type DeleteFeaturedSchool = (
  input: DeleteFeaturedSchoolInput,
) => Promise<DeleteFeaturedSchoolResult>;

export function createDeleteFeaturedSchool(deps: {
  rootHost: string;
  store: FeaturedSchoolStorePort;
}): DeleteFeaturedSchool {
  const { rootHost, store } = deps;

  return async (input) => {
    const rejected = rejectIfNotAdminHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    if (!isFeaturedSchoolId(input.id)) {
      return { ok: false, status: 404, error: "Featured school not found" };
    }

    const removed = await store.remove(input.id);
    if (!removed.ok) {
      return { ok: false, status: 404, error: "Featured school not found" };
    }

    return { ok: true };
  };
}
