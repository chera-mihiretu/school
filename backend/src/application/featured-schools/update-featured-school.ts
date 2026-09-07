import { isFeaturedSchoolId } from "../../domain/featured-schools/featured-school.ts";
import {
  normalizeSchoolName,
  normalizeSchoolSlug,
  validateFeaturedSchoolName,
  validateFeaturedSchoolSlug,
} from "../../domain/featured-schools/slug.ts";
import type {
  FeaturedSchoolStorePort,
  FeaturedSchoolUpdateInput,
} from "../../domain/ports/featured-school-store-port.ts";
import { rejectIfNotAdminHost } from "../platform-admin/require-admin-host.ts";
import { toAdminView, type FeaturedSchoolAdminView } from "./views.ts";

export type UpdateFeaturedSchoolInput = {
  hostHeader: string;
  id: string;
  name?: string;
  slug?: string;
  published?: boolean;
  sort_order?: number;
};

export type UpdateFeaturedSchoolResult =
  | { ok: true; school: FeaturedSchoolAdminView }
  | { ok: false; status: 400 | 403 | 404 | 409; error: string };

export type UpdateFeaturedSchool = (
  input: UpdateFeaturedSchoolInput,
) => Promise<UpdateFeaturedSchoolResult>;

export function createUpdateFeaturedSchool(deps: {
  rootHost: string;
  store: FeaturedSchoolStorePort;
}): UpdateFeaturedSchool {
  const { rootHost, store } = deps;

  return async (input) => {
    const rejected = rejectIfNotAdminHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    if (!isFeaturedSchoolId(input.id)) {
      return { ok: false, status: 404, error: "Featured school not found" };
    }

    const changes: FeaturedSchoolUpdateInput = { id: input.id };

    if (input.name !== undefined) {
      const name = normalizeSchoolName(input.name);
      const invalidName = validateFeaturedSchoolName(name);
      if (invalidName !== undefined) {
        return { ok: false, status: 400, error: invalidName };
      }
      changes.name = name;
    }

    if (input.slug !== undefined) {
      const slug = normalizeSchoolSlug(input.slug);
      const invalidSlug = validateFeaturedSchoolSlug(slug);
      if (invalidSlug !== undefined) {
        return { ok: false, status: 400, error: invalidSlug };
      }
      changes.slug = slug;
    }

    if (input.published !== undefined) {
      changes.published = input.published;
    }

    if (input.sort_order !== undefined) {
      if (!Number.isInteger(input.sort_order)) {
        return { ok: false, status: 400, error: "sort_order must be an integer" };
      }
      changes.sortOrder = input.sort_order;
    }

    if (
      changes.name === undefined &&
      changes.slug === undefined &&
      changes.published === undefined &&
      changes.sortOrder === undefined
    ) {
      return { ok: false, status: 400, error: "No fields to update" };
    }

    const updated = await store.update(changes);
    if (!updated.ok) {
      switch (updated.reason) {
        case "not_found":
          return { ok: false, status: 404, error: "Featured school not found" };
        case "slug_taken":
          return {
            ok: false,
            status: 409,
            error: `"${changes.slug ?? input.slug}" is already listed`,
          };
        default: {
          const _never: never = updated.reason;
          return _never;
        }
      }
    }

    return { ok: true, school: toAdminView(updated.school, rootHost) };
  };
}
