import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Tenant } from "../../domain/tenants/tenant.ts";
import { createGetAdminDashboard } from "./get-admin-dashboard.ts";
import { createMemoryTenantStore } from "./memory-tenant-store.ts";

function liveTenant(index: number): Tenant {
  const stamp = String(index).padStart(2, "0");
  return {
    id: `11111111-1111-1111-1111-1111111111${stamp}`,
    name: `School ${index}`,
    slug: `school-${index}`,
    email: null,
    status: "active",
    founded: "Founded 2026",
    createdAt: new Date(`2026-09-0${index}T10:00:00.000Z`),
    mustChangePassword: false,
    lastMailAt: null,
    lastMailOk: null,
    lastMailError: null,
    signedInAt: null,
    abbreviation: null,
  };
}

describe("createGetAdminDashboard", () => {
  it("returns empty zeros and a derived serving of 0", async () => {
    const getDashboard = createGetAdminDashboard({
      rootHost: "e-school.et",
      store: createMemoryTenantStore(),
    });

    const result = await getDashboard({ hostHeader: "admin.e-school.et:3000" });
    assert.deepEqual(result, {
      ok: true,
      schoolCount: 0,
      activeCount: 0,
      pendingSetupCount: 0,
      suspendedCount: 0,
      servingPercent: 0,
      createdByYear: {},
      newest: [],
    });
  });

  it("reads the stats row and derives serving from active over all schools", async () => {
    const store = createMemoryTenantStore([
      liveTenant(1),
      { ...liveTenant(2), status: "suspended", slug: "school-2" },
      { ...liveTenant(3), status: "pending_setup", slug: null },
    ]);
    await store.ensureSchema();

    const getDashboard = createGetAdminDashboard({
      rootHost: "e-school.et",
      store,
    });
    const result = await getDashboard({ hostHeader: "admin.e-school.et" });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.equal(result.schoolCount, 3);
    assert.equal(result.activeCount, 1);
    assert.equal(result.pendingSetupCount, 1);
    assert.equal(result.suspendedCount, 1);
    assert.equal(result.servingPercent, 33);
    assert.deepEqual(result.createdByYear, { "2026": 3 });
    assert.equal(result.newest.length, 3);
    assert.equal(result.newest[0]?.name, "School 3");
  });

  it("rejects school hosts", async () => {
    const getDashboard = createGetAdminDashboard({
      rootHost: "e-school.et",
      store: createMemoryTenantStore([liveTenant(1)]),
    });

    const result = await getDashboard({ hostHeader: "school-1.e-school.et" });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 403);
    }
  });
});
