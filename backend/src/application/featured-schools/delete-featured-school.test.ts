import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FeaturedSchool } from "../../domain/featured-schools/featured-school.ts";
import { createDeleteFeaturedSchool } from "./delete-featured-school.ts";
import { createMemoryFeaturedSchoolStore } from "./memory-featured-school-store.ts";

const northHall: FeaturedSchool = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "North Hall",
  slug: "north-hall",
  createdAt: new Date("2026-09-01T10:00:00.000Z"),
  sortOrder: 0,
  published: true,
};

describe("createDeleteFeaturedSchool", () => {
  it("removes a row on the admin host", async () => {
    const store = createMemoryFeaturedSchoolStore([northHall]);
    const remove = createDeleteFeaturedSchool({
      rootHost: "e-school.et",
      store,
    });

    const result = await remove({
      hostHeader: "admin.e-school.et",
      id: northHall.id,
    });
    assert.deepEqual(result, { ok: true });
    assert.deepEqual(await store.listAll(), []);
  });

  it("returns 404 for unknown ids and 403 from school hosts", async () => {
    const remove = createDeleteFeaturedSchool({
      rootHost: "e-school.et",
      store: createMemoryFeaturedSchoolStore([northHall]),
    });

    const missing = await remove({
      hostHeader: "admin.e-school.et",
      id: "99999999-9999-9999-9999-999999999999",
    });
    assert.equal(missing.ok, false);
    if (!missing.ok) {
      assert.equal(missing.status, 404);
    }

    const fromSchool = await remove({
      hostHeader: "demo.e-school.et",
      id: northHall.id,
    });
    assert.equal(fromSchool.ok, false);
    if (!fromSchool.ok) {
      assert.equal(fromSchool.status, 403);
    }
  });
});
