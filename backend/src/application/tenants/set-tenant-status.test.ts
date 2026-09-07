import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Tenant } from "../../domain/tenants/tenant.ts";
import { createMemoryTenantStore } from "./memory-tenant-store.ts";
import {
  createReactivateTenant,
  createSuspendTenant,
} from "./set-tenant-status.ts";

const campus: Tenant = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "North Hall",
  slug: "north-hall",
  email: null,
  status: "active",
  founded: "Founded 2024",
  createdAt: new Date("2026-09-01T10:00:00.000Z"),
  mustChangePassword: false,
  lastMailAt: null,
  lastMailOk: null,
  lastMailError: null,
  signedInAt: null,
  abbreviation: null,
};

describe("set tenant status", () => {
  it("suspends and reactivates idempotently", async () => {
    const store = createMemoryTenantStore([campus]);
    const suspend = createSuspendTenant({ rootHost: "e-school.et", store });
    const reactivate = createReactivateTenant({
      rootHost: "e-school.et",
      store,
    });

    const first = await suspend({
      hostHeader: "admin.e-school.et:3000",
      id: campus.id,
    });
    assert.equal(first.ok, true);
    if (first.ok) {
      assert.equal(first.school.status, "suspended");
    }

    const again = await suspend({
      hostHeader: "admin.e-school.et:3000",
      id: campus.id,
    });
    assert.equal(again.ok, true);
    if (again.ok) {
      assert.equal(again.school.status, "suspended");
    }

    const restored = await reactivate({
      hostHeader: "admin.e-school.et:3000",
      id: campus.id,
    });
    assert.equal(restored.ok, true);
    if (restored.ok) {
      assert.equal(restored.school.status, "active");
    }
  });

  it("returns 404 for an unknown id", async () => {
    const suspend = createSuspendTenant({
      rootHost: "e-school.et",
      store: createMemoryTenantStore(),
    });

    const result = await suspend({
      hostHeader: "admin.e-school.et:3000",
      id: campus.id,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 404);
    }
  });
});
