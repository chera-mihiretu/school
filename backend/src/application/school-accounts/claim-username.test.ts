import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryTenantStore } from "../tenants/memory-tenant-store.ts";
import { tenantSchemaName } from "../../domain/school-slug.ts";
import { createClaimSchoolAccountUsername } from "./claim-username.ts";

async function seedClaim(input?: { mustChangePassword?: boolean }) {
  const store = createMemoryTenantStore();
  const inserted = await store.insertPending({
    name: "North Hall",
    email: "head@north-hall.et",
    passwordHash: "hash:kept-password",
    founded: "Founded 2026",
  });
  assert.equal(inserted.ok, true);
  if (!inserted.ok) {
    throw new Error("insert failed");
  }

  if (input?.mustChangePassword === false) {
    await store.updatePassword({
      id: inserted.tenant.id,
      passwordHash: "hash:kept-password",
      mustChangePassword: false,
    });
  }

  return {
    store,
    tenant: inserted.tenant,
    claim: createClaimSchoolAccountUsername({
      rootHost: "e-school.et",
      store,
    }),
  };
}

describe("createClaimSchoolAccountUsername", () => {
  it("rejects a claim before the password is changed", async () => {
    const { claim, tenant, store } = await seedClaim();
    const result = await claim({
      hostHeader: "app.e-school.et:3000",
      accountId: tenant.id,
      slug: "north-hall",
    });
    assert.deepEqual(result, {
      ok: false,
      status: 409,
      error: "Change your password first",
    });
    assert.equal((await store.findAuthById(tenant.id))?.tenant.slug, null);
  });

  it("rejects reserved, invalid, and taken usernames", async () => {
    const { claim, tenant, store } = await seedClaim({
      mustChangePassword: false,
    });
    await store.insert({
      name: "East Yard",
      slug: "east-yard",
      founded: "Founded 2026",
    });

    const reserved = await claim({
      hostHeader: "app.e-school.et:3000",
      accountId: tenant.id,
      slug: "app",
    });
    assert.equal(reserved.ok, false);
    if (!reserved.ok) {
      assert.equal(reserved.status, 400);
      assert.match(reserved.error, /reserved/);
    }

    const invalid = await claim({
      hostHeader: "app.e-school.et:3000",
      accountId: tenant.id,
      slug: "-nope-",
    });
    assert.equal(invalid.ok, false);
    if (!invalid.ok) {
      assert.equal(invalid.status, 400);
    }

    const taken = await claim({
      hostHeader: "app.e-school.et:3000",
      accountId: tenant.id,
      slug: "east-yard",
    });
    assert.deepEqual(taken, {
      ok: false,
      status: 409,
      error: '"east-yard" is already taken',
    });
    assert.equal((await store.findAuthById(tenant.id))?.tenant.slug, null);
  });

  it("claims a slug, activates the school, and names the schema", async () => {
    const { claim, tenant, store } = await seedClaim({
      mustChangePassword: false,
    });
    const result = await claim({
      hostHeader: "app.e-school.et:3000",
      accountId: tenant.id,
      slug: "North-Hall",
    });
    assert.deepEqual(result, {
      ok: true,
      slug: "north-hall",
      host: "north-hall.e-school.et",
    });

    const auth = await store.findAuthById(tenant.id);
    assert.equal(auth?.tenant.slug, "north-hall");
    assert.equal(auth?.tenant.status, "active");
    assert.equal(tenantSchemaName("north-hall"), "tenant_north_hall");
  });

  it("returns already_claimed on a second claim", async () => {
    const { claim, tenant } = await seedClaim({ mustChangePassword: false });
    const first = await claim({
      hostHeader: "app.e-school.et:3000",
      accountId: tenant.id,
      slug: "north-hall",
    });
    assert.equal(first.ok, true);

    const second = await claim({
      hostHeader: "app.e-school.et:3000",
      accountId: tenant.id,
      slug: "east-yard",
    });
    assert.deepEqual(second, {
      ok: false,
      status: 409,
      error: "This school already has a username",
    });
  });

  it("rejects a campus host", async () => {
    const { claim, tenant } = await seedClaim({ mustChangePassword: false });
    const result = await claim({
      hostHeader: "north-hall.e-school.et:3000",
      accountId: tenant.id,
      slug: "north-hall",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 403);
    }
  });
});
