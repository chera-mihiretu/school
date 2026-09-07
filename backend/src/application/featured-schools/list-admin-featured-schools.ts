import type { FeaturedSchoolStorePort } from "../../domain/ports/featured-school-store-port.ts";
import { rejectIfNotAdminHost } from "../platform-admin/require-admin-host.ts";
import { toAdminView, type FeaturedSchoolAdminView } from "./views.ts";

export type ListAdminFeaturedSchoolsInput = {
  hostHeader: string;
};

export type ListAdminFeaturedSchoolsResult =
  | { ok: true; schools: FeaturedSchoolAdminView[] }
  | { ok: false; status: 403; error: string };

export type ListAdminFeaturedSchools = (
  input: ListAdminFeaturedSchoolsInput,
) => Promise<ListAdminFeaturedSchoolsResult>;

export function createListAdminFeaturedSchools(deps: {
  rootHost: string;
  store: FeaturedSchoolStorePort;
}): ListAdminFeaturedSchools {
  const { rootHost, store } = deps;

  return async (input) => {
    const rejected = rejectIfNotAdminHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    const schools = await store.listAll();
    return {
      ok: true,
      schools: schools.map((school) => toAdminView(school, rootHost)),
    };
  };
}
