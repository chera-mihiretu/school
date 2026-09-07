import { randomUUID } from "node:crypto";
import type { FeaturedSchool } from "../../domain/featured-schools/featured-school.ts";
import type { FeaturedSchoolStorePort } from "../../domain/ports/featured-school-store-port.ts";

function byDirectoryOrder(left: FeaturedSchool, right: FeaturedSchool): number {
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }
  return left.createdAt.getTime() - right.createdAt.getTime();
}

export function createMemoryFeaturedSchoolStore(
  seed: FeaturedSchool[] = [],
): FeaturedSchoolStorePort {
  const rows = seed.map((school) => ({ ...school }));

  return {
    async ensureSchema() {},
    async listPublished() {
      return rows.filter((row) => row.published).sort(byDirectoryOrder);
    },
    async listAll() {
      return [...rows].sort(byDirectoryOrder);
    },
    async insert(input) {
      if (rows.some((row) => row.slug === input.slug)) {
        return { ok: false, reason: "slug_taken" };
      }
      const sortOrder =
        rows.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;
      const school: FeaturedSchool = {
        id: randomUUID(),
        name: input.name,
        slug: input.slug,
        createdAt: new Date("2026-09-06T12:00:00.000Z"),
        sortOrder,
        published: true,
      };
      rows.push(school);
      return { ok: true, school };
    },
    async update(input) {
      const school = rows.find((row) => row.id === input.id);
      if (school === undefined) {
        return { ok: false, reason: "not_found" };
      }
      if (
        input.slug !== undefined &&
        rows.some((row) => row.slug === input.slug && row.id !== input.id)
      ) {
        return { ok: false, reason: "slug_taken" };
      }
      if (input.name !== undefined) {
        school.name = input.name;
      }
      if (input.slug !== undefined) {
        school.slug = input.slug;
      }
      if (input.published !== undefined) {
        school.published = input.published;
      }
      if (input.sortOrder !== undefined) {
        school.sortOrder = input.sortOrder;
      }
      return { ok: true, school: { ...school } };
    },
    async remove(id) {
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) {
        return { ok: false, reason: "not_found" };
      }
      rows.splice(index, 1);
      return { ok: true };
    },
  };
}
