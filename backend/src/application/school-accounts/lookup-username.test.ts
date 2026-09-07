import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLookupTenantUsername } from "../tenants/lookup-tenant-username.ts";
import { createMemoryTenantStore } from "../tenants/memory-tenant-store.ts";
import { createLookupSchoolAccountUsername } from "./lookup-username.ts";

describe("createLookupSchoolAccountUsername", () => {
  it("matches the admin lookup for reserved, app, taken, and free names", async () => {
    const store = createMemoryTenantStore([
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
    ]);
    const pending = await store.insertPending({
      name: "Lookup Director",
      email: "head@lookup-hall.et",
      passwordHash: "hash:temporary-pass",
      founded: "Founded 2026",
    });
    assert.equal(pending.ok, true);
    if (!pending.ok) {
      throw new Error("insert failed");
    }
    const admin = createLookupTenantUsername({
      rootHost: "e-school.et",
      store,
    });
    const school = createLookupSchoolAccountUsername({
      rootHost: "e-school.et",
      store,
    });

    for (const slug of ["north-hall", "app", "admin", "-nope-", "west-quay"]) {
      const adminResult = await admin({
        hostHeader: "admin.e-school.et:3000",
        slug,
      });
      const schoolResult = await school({
        hostHeader: "app.e-school.et:3000",
        accountId: pending.tenant.id,
        slug,
      });
      assert.equal(adminResult.ok, true);
      assert.equal(schoolResult.ok, true);
      if (adminResult.ok && schoolResult.ok) {
        assert.deepEqual(
          {
            username: schoolResult.username,
            available: schoolResult.available,
            ...("reason" in schoolResult ? { reason: schoolResult.reason } : {}),
          },
          {
            username: adminResult.username,
            available: adminResult.available,
            ...("reason" in adminResult ? { reason: adminResult.reason } : {}),
          },
        );
      }
    }
  });

  it("rejects a campus host", async () => {
    const lookup = createLookupSchoolAccountUsername({
      rootHost: "e-school.et",
      store: createMemoryTenantStore(),
    });
    const result = await lookup({
      hostHeader: "north-hall.e-school.et",
      accountId: "11111111-1111-1111-1111-111111111111",
      slug: "east-yard",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 403);
    }
  });

  it("rejects an unknown account", async () => {
    const lookup = createLookupSchoolAccountUsername({
      rootHost: "e-school.et",
      store: createMemoryTenantStore(),
    });
    const result = await lookup({
      hostHeader: "app.e-school.et:3000",
      accountId: "11111111-1111-1111-1111-111111111111",
      slug: "east-yard",
    });
    assert.deepEqual(result, {
      ok: false,
      status: 403,
      error: "Unauthorized",
    });
  });
});
