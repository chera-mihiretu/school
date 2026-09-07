export type FeaturedSchool = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  sortOrder: number;
  published: boolean;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isFeaturedSchoolId(id: string): boolean {
  return UUID_PATTERN.test(id);
}
