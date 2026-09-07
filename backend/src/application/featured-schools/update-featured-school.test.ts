import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FeaturedSchool } from "../../domain/featured-schools/featured-school.ts";
import { createMemoryFeaturedSchoolStore } from "./memory-featured-school-store.ts";
import { createUpdateFeaturedSchool } from "./update-featured-school.ts";

const northHall: FeaturedSchool = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "North Hall",
  slug: "north-hall",
  createdAt: new Date("2026-09-01T10:00:00.000Z"),
  sortOrder: 0,
  published: true,
};

const riverOak: FeaturedSchool = {
  id: "22222222-2222-2222-2222-222222222222",
  name: "River Oak",
  slug: "river-oak",
  createdAt: new Date("2026-09-02T10:00:00.000Z"),
  sortOrder: 1,
  published: true,
};

describe("createUpdateFeaturedSchool", () => {
  it("patches published and sort_order on the admin host", async () => {
    const update = createUpdateFeaturedSchool({
      rootHost: "e-school.et",
      store: createMemoryFeaturedSchoolStore([northHall]),
    });

    const result = await update({
      hostHeader: "admin.e-school.et:3000",
      id: northHall.id,
      published: false,
      sort_order: 4,
    });

    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.school.published, false);
    assert.equal(result.school.sort_order, 4);
    assert.equal(result.school.host, "north-hall.e-school.et");
  });

  it("rejects missing rows, taken slugs, and school hosts", async () => {
    const update = createUpdateFeaturedSchool({
      rootHost: "e-school.et",
      store: createMemoryFeaturedSchoolStore([northHall, riverOak]),
    });

    const missing = await update({
      hostHeader: "admin.e-school.et",
      id: "99999999-9999-9999-9999-999999999999",
      name: "Gone",
    });
    assert.equal(missing.ok, false);
    if (!missing.ok) {
      assert.equal(missing.status, 404);
    }

    const taken = await update({
      hostHeader: "admin.e-school.et",
      id: northHall.id,
      slug: "river-oak",
    });
    assert.equal(taken.ok, false);
    if (!taken.ok) {
      assert.equal(taken.status, 409);
    }

    const fromSchool = await update({
      hostHeader: "north-hall.e-school.et",
      id: northHall.id,
      name: "Hacked",
    });
    assert.equal(fromSchool.ok, false);
    if (!fromSchool.ok) {
      assert.equal(fromSchool.status, 403);
    }
  });
});
