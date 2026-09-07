import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryTenantStore } from "../tenants/memory-tenant-store.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import { createChangeSchoolAccountPassword } from "./change-password.ts";

const hasher: PasswordHasherPort = {
  async hash(password) {
    return `hash:${password}`;
  },
  async verify(passwordHash, password) {
    return passwordHash === `hash:${password}`;
  },
};

async function seedChange() {
  const store = createMemoryTenantStore();
  const inserted = await store.insertPending({
    name: "North Hall",
    email: "head@north-hall.et",
    passwordHash: "hash:temporary-pass",
    founded: "Founded 2026",
  });
  assert.equal(inserted.ok, true);
  if (!inserted.ok) {
    throw new Error("insert failed");
  }
  return {
    store,
    tenant: inserted.tenant,
    change: createChangeSchoolAccountPassword({
      rootHost: "e-school.et",
      store,
      hasher,
    }),
  };
}

describe("createChangeSchoolAccountPassword", () => {
  it("persists a new hash and flips mustChangePassword", async () => {
    const { change, store, tenant } = await seedChange();
    const result = await change({
      hostHeader: "app.e-school.et:3000",
      accountId: tenant.id,
      expiresAt: "2026-09-06T13:00:00.000Z",
      currentPassword: "temporary-pass",
      newPassword: "a-kept-password",
    });

    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.session.mustChangePassword, false);
    assert.equal(result.session.nextStep, "username");
    assert.equal(result.session.expiresAt, "2026-09-06T13:00:00.000Z");

    const auth = await store.findAuthById(tenant.id);
    assert.equal(auth?.passwordHash, "hash:a-kept-password");
    assert.equal(auth?.tenant.mustChangePassword, false);
  });

  it("rejects a new password equal to the current one", async () => {
    const { change, tenant, store } = await seedChange();
    const result = await change({
      hostHeader: "app.e-school.et:3000",
      accountId: tenant.id,
      expiresAt: "2026-09-06T13:00:00.000Z",
      currentPassword: "temporary-pass",
      newPassword: "temporary-pass",
    });
    assert.deepEqual(result, {
      ok: false,
      status: 400,
      error: "New password must be different from the current password",
    });
    assert.equal((await store.findAuthById(tenant.id))?.tenant.mustChangePassword, true);
  });

  it("rejects a short password", async () => {
    const { change, tenant } = await seedChange();
    const result = await change({
      hostHeader: "app.e-school.et:3000",
      accountId: tenant.id,
      expiresAt: "2026-09-06T13:00:00.000Z",
      currentPassword: "temporary-pass",
      newPassword: "short-pass",
    });
    assert.deepEqual(result, {
      ok: false,
      status: 400,
      error: "Password must be at least 12 characters",
    });
  });
});
