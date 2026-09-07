import type { FeaturedSchool } from "../featured-schools/featured-school.ts";

export type FeaturedSchoolInsertResult =
  | { ok: true; school: FeaturedSchool }
  | { ok: false; reason: "slug_taken" };

export type FeaturedSchoolUpdateInput = {
  id: string;
  name?: string;
  slug?: string;
  published?: boolean;
  sortOrder?: number;
};

export type FeaturedSchoolUpdateResult =
  | { ok: true; school: FeaturedSchool }
  | { ok: false; reason: "not_found" | "slug_taken" };

export type FeaturedSchoolRemoveResult =
  | { ok: true }
  | { ok: false; reason: "not_found" };

export type FeaturedSchoolStorePort = {
  ensureSchema: () => Promise<void>;
  listPublished: () => Promise<FeaturedSchool[]>;
  listAll: () => Promise<FeaturedSchool[]>;
  insert: (input: { name: string; slug: string }) => Promise<FeaturedSchoolInsertResult>;
  update: (input: FeaturedSchoolUpdateInput) => Promise<FeaturedSchoolUpdateResult>;
  remove: (id: string) => Promise<FeaturedSchoolRemoveResult>;
};
