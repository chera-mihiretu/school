import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FeaturedSchool } from "../../domain/featured-schools/featured-school.ts";
import { createListAdminFeaturedSchools } from "./list-admin-featured-schools.ts";
import { createMemoryFeaturedSchoolStore } from "./memory-featured-school-store.ts";

const northHall: FeaturedSchool = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "North Hall",
  slug: "north-hall",
  createdAt: new Date("2026-09-01T10:00:00.000Z"),
  sortOrder: 0,
  published: false,
};

describe("createListAdminFeaturedSchools", () => {
  it("lists every row on the admin host", async () => {
    const list = createListAdminFeaturedSchools({
      rootHost: "e-school.et",
      store: createMemoryFeaturedSchoolStore([northHall]),
    });

    const result = await list({ hostHeader: "admin.e-school.et:3000" });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.deepEqual(result.schools, [
      {
        id: northHall.id,
        name: "North Hall",
        slug: "north-hall",
        created: "2026-09-01T10:00:00.000Z",
        host: "north-hall.e-school.et",
        published: false,
        sort_order: 0,
      },
    ]);
  });

  it("rejects school hosts", async () => {
    const list = createListAdminFeaturedSchools({
      rootHost: "e-school.et",
      store: createMemoryFeaturedSchoolStore([northHall]),
    });

    const result = await list({ hostHeader: "north-hall.e-school.et" });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 403);
    }
  });
});
