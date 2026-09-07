export type FeaturedSchool = {
  id: string;
  name: string;
  slug: string;
  created: string;
  host: string;
};

export function parseFeaturedSchool(value: unknown): FeaturedSchool | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const id = record.id;
  const name = record.name;
  const slug = record.slug;

  if (typeof name !== "string" || name.length === 0) {
    return undefined;
  }
  if (typeof slug !== "string" || slug.length === 0) {
    return undefined;
  }
  if (typeof id !== "string" && typeof id !== "number") {
    return undefined;
  }

  return {
    id: String(id),
    name,
    slug,
    created: typeof record.created === "string" ? record.created : "",
    host: typeof record.host === "string" ? record.host : "",
  };
}

export function parseFeaturedSchools(value: unknown): FeaturedSchool[] {
  if (value === null || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const schools = record.schools;
  if (!Array.isArray(schools)) {
    return [];
  }

  return schools.flatMap((item) => {
    const school = parseFeaturedSchool(item);
    return school === undefined ? [] : [school];
  });
}

export function featuredSchoolHost(
  school: Pick<FeaturedSchool, "host" | "slug">,
  rootHost: string,
): string {
  if (school.host.length > 0) {
    return school.host;
  }
  return `${school.slug}.${rootHost}`;
}
