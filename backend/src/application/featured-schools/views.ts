import type { FeaturedSchool } from "../../domain/featured-schools/featured-school.ts";

export type FeaturedSchoolPublicView = {
  id: string;
  name: string;
  slug: string;
  created: string;
  host: string;
};

export type FeaturedSchoolAdminView = FeaturedSchoolPublicView & {
  published: boolean;
  sort_order: number;
};

export function toPublicView(
  school: FeaturedSchool,
  rootHost: string,
): FeaturedSchoolPublicView {
  return {
    id: school.id,
    name: school.name,
    slug: school.slug,
    created: school.createdAt.toISOString(),
    host: `${school.slug}.${rootHost}`,
  };
}

export function toAdminView(
  school: FeaturedSchool,
  rootHost: string,
): FeaturedSchoolAdminView {
  return {
    ...toPublicView(school, rootHost),
    published: school.published,
    sort_order: school.sortOrder,
  };
}
