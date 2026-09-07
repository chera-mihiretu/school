import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLookupTenantUsername } from "./lookup-tenant-username.ts";
import { createMemoryTenantStore } from "./memory-tenant-store.ts";

describe("createLookupTenantUsername", () => {
  it("reports a free username on the admin host", async () => {
    const lookup = createLookupTenantUsername({
      rootHost: "e-school.et",
      store: createMemoryTenantStore(),
    });

    const result = await lookup({
      hostHeader: "admin.e-school.et:3000",
      slug: "North-Hall",
    });
    assert.deepEqual(result, {
      ok: true,
      username: "north-hall",
      available: true,
    });
  });

  it("reports taken, reserved, and invalid usernames", async () => {
    const lookup = createLookupTenantUsername({
      rootHost: "e-school.et",
      store: createMemoryTenantStore([
        {
          id: "11111111-1111-1111-1111-111111111111",
          name: "North Hall",
          slug: "north-hall",
          email: null,
          status: "active",
          founded: "Founded 2026",
          createdAt: new Date("2026-09-01T10:00:00.000Z"),
          mustChangePassword: false,
          lastMailAt: null,
          lastMailOk: null,
          lastMailError: null,
          signedInAt: null,
          abbreviation: null,
        },
      ]),
    });

    const taken = await lookup({
      hostHeader: "admin.e-school.et",
      slug: "north-hall",
    });
    assert.deepEqual(taken, {
      ok: true,
      username: "north-hall",
      available: false,
      reason: "taken",
    });

    const reserved = await lookup({
      hostHeader: "admin.e-school.et",
      slug: "admin",
    });
    assert.deepEqual(reserved, {
      ok: true,
      username: "admin",
      available: false,
      reason: "reserved",
    });

    const invalid = await lookup({
      hostHeader: "admin.e-school.et",
      slug: "-nope-",
    });
    assert.deepEqual(invalid, {
      ok: true,
      username: "-nope-",
      available: false,
      reason: "invalid",
    });
  });

  it("rejects school hosts", async () => {
    const lookup = createLookupTenantUsername({
      rootHost: "e-school.et",
      store: createMemoryTenantStore(),
    });

    const result = await lookup({
      hostHeader: "north-hall.e-school.et",
      slug: "east-yard",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 403);
    }
  });
});
