import type { FeaturedSchoolStorePort } from "../../domain/ports/featured-school-store-port.ts";
import { toPublicView, type FeaturedSchoolPublicView } from "./views.ts";

export type ListPublicFeaturedSchools = () => Promise<{
  schools: FeaturedSchoolPublicView[];
}>;

export function createListPublicFeaturedSchools(deps: {
  rootHost: string;
  store: FeaturedSchoolStorePort;
}): ListPublicFeaturedSchools {
  const { rootHost, store } = deps;

  return async () => {
    const schools = await store.listPublished();
    return {
      schools: schools.map((school) => toPublicView(school, rootHost)),
    };
  };
}
