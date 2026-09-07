import {
  normalizeSchoolName,
  normalizeSchoolSlug,
  validateFeaturedSchoolName,
  validateFeaturedSchoolSlug,
} from "../../domain/featured-schools/slug.ts";
import type { FeaturedSchoolStorePort } from "../../domain/ports/featured-school-store-port.ts";
import { rejectIfNotAdminHost } from "../platform-admin/require-admin-host.ts";
import { toAdminView, type FeaturedSchoolAdminView } from "./views.ts";

export type CreateFeaturedSchoolInput = {
  hostHeader: string;
  name: string;
  slug: string;
};

export type CreateFeaturedSchoolResult =
  | { ok: true; school: FeaturedSchoolAdminView }
  | { ok: false; status: 400 | 403 | 409; error: string };

export type CreateFeaturedSchool = (
  input: CreateFeaturedSchoolInput,
) => Promise<CreateFeaturedSchoolResult>;

export function createCreateFeaturedSchool(deps: {
  rootHost: string;
  store: FeaturedSchoolStorePort;
}): CreateFeaturedSchool {
  const { rootHost, store } = deps;

  return async (input) => {
    const rejected = rejectIfNotAdminHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    const name = normalizeSchoolName(input.name);
    const slug = normalizeSchoolSlug(input.slug);
    const invalidName = validateFeaturedSchoolName(name);
    if (invalidName !== undefined) {
      return { ok: false, status: 400, error: invalidName };
    }

    const invalidSlug = validateFeaturedSchoolSlug(slug);
    if (invalidSlug !== undefined) {
      return { ok: false, status: 400, error: invalidSlug };
    }

    const inserted = await store.insert({ name, slug });
    if (!inserted.ok) {
      return { ok: false, status: 409, error: `"${slug}" is already listed` };
    }

    return { ok: true, school: toAdminView(inserted.school, rootHost) };
  };
}
