import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Tenant } from "../../domain/tenants/tenant.ts";
import { createListAdminTenants } from "./list-admin-tenants.ts";
import { createMemoryTenantStore } from "./memory-tenant-store.ts";

function tenant(index: number, createdDay: string): Tenant {
  const stamp = String(index).padStart(2, "0");
  return {
    id: `11111111-1111-1111-1111-1111111111${stamp}`,
    name: `School ${index}`,
    slug: `school-${index}`,
    email: null,
    status: "active",
    founded: `Founded 202${index % 10}`,
    createdAt: new Date(`2026-09-${createdDay}T10:00:00.000Z`),
    mustChangePassword: false,
    lastMailAt: null,
    lastMailOk: null,
    lastMailError: null,
    signedInAt: null,
    abbreviation: null,
  };
}

const first = tenant(1, "01");
const second = tenant(2, "02");
const third = tenant(3, "03");

describe("createListAdminTenants", () => {
  it("returns an empty page", async () => {
    const list = createListAdminTenants({
      rootHost: "e-school.et",
      store: createMemoryTenantStore(),
    });

    const result = await list({ hostHeader: "admin.e-school.et:3000" });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.deepEqual(result, {
      ok: true,
      schools: [],
      page: 1,
      pageSize: 10,
      total: 0,
    });
  });

  it("lists the newest tenants first and serves the second page", async () => {
    const list = createListAdminTenants({
      rootHost: "e-school.et",
      store: createMemoryTenantStore([first, second, third]),
    });

    const pageTwo = await list({
      hostHeader: "admin.e-school.et:3000",
      page: 2,
      pageSize: 2,
    });
    assert.equal(pageTwo.ok, true);
    if (!pageTwo.ok) {
      return;
    }

    assert.equal(pageTwo.page, 2);
    assert.equal(pageTwo.pageSize, 2);
    assert.equal(pageTwo.total, 3);
    assert.deepEqual(
      pageTwo.schools.map((school) => school.slug),
      ["school-1"],
    );
    assert.equal(pageTwo.schools[0]?.username, "school-1");
    assert.equal(pageTwo.schools[0]?.host, "school-1.e-school.et");
  });

  it("clamps page bounds before querying", async () => {
    const list = createListAdminTenants({
      rootHost: "e-school.et",
      store: createMemoryTenantStore([first]),
    });

    const result = await list({
      hostHeader: "admin.e-school.et:3000",
      page: 0,
      pageSize: 100,
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.equal(result.page, 1);
    assert.equal(result.pageSize, 50);
    assert.equal(result.total, 1);
    assert.equal(result.schools.length, 1);
  });

  it("rejects school hosts", async () => {
    const list = createListAdminTenants({
      rootHost: "e-school.et",
      store: createMemoryTenantStore([first]),
    });

    const result = await list({ hostHeader: "school-1.e-school.et" });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 403);
    }
  });
});
