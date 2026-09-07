import type { Sql } from "postgres";
import type { FeaturedSchool } from "../../domain/featured-schools/featured-school.ts";
import type { FeaturedSchoolStorePort } from "../../domain/ports/featured-school-store-port.ts";

type FeaturedSchoolRow = {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
  sort_order: number;
  published: boolean;
};

function mapRow(row: FeaturedSchoolRow): FeaturedSchool {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
    sortOrder: row.sort_order,
    published: row.published,
  };
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "23505"
  );
}

export function createFeaturedSchoolStore(sql: Sql): FeaturedSchoolStorePort {
  return {
    async ensureSchema() {
      await sql`create schema if not exists platform`;
      await sql`
        create table if not exists platform.featured_schools (
          id uuid primary key default gen_random_uuid(),
          name text not null,
          slug text not null unique,
          created_at timestamptz not null default now(),
          sort_order integer not null default 0,
          published boolean not null default true
        )
      `;
    },
    async listPublished() {
      const rows = await sql<FeaturedSchoolRow[]>`
        select id, name, slug, created_at, sort_order, published
        from platform.featured_schools
        where published = true
        order by sort_order asc, created_at asc
      `;
      return rows.map(mapRow);
    },
    async listAll() {
      const rows = await sql<FeaturedSchoolRow[]>`
        select id, name, slug, created_at, sort_order, published
        from platform.featured_schools
        order by sort_order asc, created_at asc
      `;
      return rows.map(mapRow);
    },
    async insert(input) {
      try {
        const rows = await sql<FeaturedSchoolRow[]>`
          insert into platform.featured_schools (name, slug, sort_order)
          values (
            ${input.name},
            ${input.slug},
            coalesce((select max(sort_order) from platform.featured_schools), -1) + 1
          )
          returning id, name, slug, created_at, sort_order, published
        `;
        const row = rows[0];
        if (row === undefined) {
          throw new Error("featured school insert returned no row");
        }
        return { ok: true, school: mapRow(row) };
      } catch (err) {
        if (isUniqueViolation(err)) {
          return { ok: false, reason: "slug_taken" };
        }
        throw err;
      }
    },
    async update(input) {
      const patch: Record<string, string | number | boolean> = {};
      if (input.name !== undefined) {
        patch.name = input.name;
      }
      if (input.slug !== undefined) {
        patch.slug = input.slug;
      }
      if (input.published !== undefined) {
        patch.published = input.published;
      }
      if (input.sortOrder !== undefined) {
        patch.sort_order = input.sortOrder;
      }

      try {
        const rows = await sql<FeaturedSchoolRow[]>`
          update platform.featured_schools
          set ${sql(patch)}
          where id = ${input.id}
          returning id, name, slug, created_at, sort_order, published
        `;
        const row = rows[0];
        if (row === undefined) {
          return { ok: false, reason: "not_found" };
        }
        return { ok: true, school: mapRow(row) };
      } catch (err) {
        if (isUniqueViolation(err)) {
          return { ok: false, reason: "slug_taken" };
        }
        throw err;
      }
    },
    async remove(id) {
      const rows = await sql<{ id: string }[]>`
        delete from platform.featured_schools
        where id = ${id}
        returning id
      `;
      if (rows[0] === undefined) {
        return { ok: false, reason: "not_found" };
      }
      return { ok: true };
    },
  };
}
