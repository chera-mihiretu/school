import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCreateFeaturedSchool } from "./create-featured-school.ts";
import { createMemoryFeaturedSchoolStore } from "./memory-featured-school-store.ts";

describe("createCreateFeaturedSchool", () => {
  it("adds a published directory row on the admin host", async () => {
    const create = createCreateFeaturedSchool({
      rootHost: "e-school.et",
      store: createMemoryFeaturedSchoolStore(),
    });

    const result = await create({
      hostHeader: "admin.e-school.et",
      name: "  North Hall  ",
      slug: "north-hall",
    });

    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.school.name, "North Hall");
    assert.equal(result.school.slug, "north-hall");
    assert.equal(result.school.host, "north-hall.e-school.et");
    assert.equal(result.school.published, true);
    assert.equal(result.school.sort_order, 0);
  });

  it("rejects reserved slugs, duplicates, and school hosts", async () => {
    const store = createMemoryFeaturedSchoolStore();
    const create = createCreateFeaturedSchool({
      rootHost: "e-school.et",
      store,
    });

    const reserved = await create({
      hostHeader: "admin.e-school.et",
      name: "Admin",
      slug: "admin",
    });
    assert.equal(reserved.ok, false);
    if (!reserved.ok) {
      assert.equal(reserved.status, 400);
    }

    const first = await create({
      hostHeader: "admin.e-school.et",
      name: "North Hall",
      slug: "north-hall",
    });
    assert.equal(first.ok, true);

    const duplicate = await create({
      hostHeader: "admin.e-school.et",
      name: "North Hall Two",
      slug: "north-hall",
    });
    assert.equal(duplicate.ok, false);
    if (!duplicate.ok) {
      assert.equal(duplicate.status, 409);
    }

    const fromSchool = await create({
      hostHeader: "demo.e-school.et",
      name: "Demo",
      slug: "demo",
    });
    assert.equal(fromSchool.ok, false);
    if (!fromSchool.ok) {
      assert.equal(fromSchool.status, 403);
    }
  });
});
