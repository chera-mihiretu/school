import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FeaturedSchool } from "../../domain/featured-schools/featured-school.ts";
import { createListPublicFeaturedSchools } from "./list-public-featured-schools.ts";
import { createMemoryFeaturedSchoolStore } from "./memory-featured-school-store.ts";

const northHall: FeaturedSchool = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "North Hall",
  slug: "north-hall",
  createdAt: new Date("2026-09-01T10:00:00.000Z"),
  sortOrder: 1,
  published: true,
};

const draftCampus: FeaturedSchool = {
  id: "22222222-2222-2222-2222-222222222222",
  name: "Draft Campus",
  slug: "draft",
  createdAt: new Date("2026-09-02T10:00:00.000Z"),
  sortOrder: 0,
  published: false,
};

const riverOak: FeaturedSchool = {
  id: "33333333-3333-3333-3333-333333333333",
  name: "River Oak",
  slug: "river-oak",
  createdAt: new Date("2026-08-01T10:00:00.000Z"),
  sortOrder: 1,
  published: true,
};

describe("createListPublicFeaturedSchools", () => {
  it("returns only published schools ordered by sort_order then created_at", async () => {
    const list = createListPublicFeaturedSchools({
      rootHost: "e-school.et",
      store: createMemoryFeaturedSchoolStore([northHall, draftCampus, riverOak]),
    });

    assert.deepEqual(await list(), {
      schools: [
        {
          id: riverOak.id,
          name: "River Oak",
          slug: "river-oak",
          created: "2026-08-01T10:00:00.000Z",
          host: "river-oak.e-school.et",
        },
        {
          id: northHall.id,
          name: "North Hall",
          slug: "north-hall",
          created: "2026-09-01T10:00:00.000Z",
          host: "north-hall.e-school.et",
        },
      ],
    });
  });
});
