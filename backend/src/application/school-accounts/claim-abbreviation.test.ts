import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ABBREVIATION_TAKEN } from "../../domain/school-abbreviation/abbreviation.ts";
import { createMemoryTenantStore } from "../tenants/memory-tenant-store.ts";
import { createHmacSchoolSessionSigner } from "../../infrastructure/auth/hmac-school-session.ts";
import { createClaimAppAbbreviation } from "./claim-abbreviation.ts";
import { createReadAppAbbreviation } from "./read-abbreviation.ts";

const sessions = createHmacSchoolSessionSigner({
  secret: "a-very-long-session-secret-value",
  ttlSeconds: 3600,
  now: () => new Date("2026-09-07T12:00:00.000Z"),
});

async function seedAfterUsername() {
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
  await store.updatePassword({
    id: inserted.tenant.id,
    passwordHash: "hash:kept-password",
    mustChangePassword: false,
  });
  await store.claimSlug({ id: inserted.tenant.id, slug: "north-hall" });
  const token = sessions.issue({
    accountId: inserted.tenant.id,
    email: "head@north-hall.et",
  }).token;
  return {
    store,
    tenant: inserted.tenant,
    token,
    read: createReadAppAbbreviation({
      rootHost: "e-school.et",
      tenants: store,
      sessions,
    }),
    claim: createClaimAppAbbreviation({
      rootHost: "e-school.et",
      tenants: store,
      sessions,
    }),
  };
}

describe("app abbreviation step", () => {
  it("suggests AAA and locks the default on save", async () => {
    const { read, claim, token, store, tenant } = await seedAfterUsername();
    const previewed = await read({
      hostHeader: "app.e-school.et:3000",
      token,
      now: new Date("2026-09-07T12:00:00.000Z"),
    });
    assert.equal(previewed.ok, true);
    if (!previewed.ok) {
      return;
    }
    assert.equal(previewed.preview.suggested, "AAA");
    assert.equal(previewed.preview.locked, false);
    assert.equal(previewed.preview.examples?.teacher, "AAAT/00001/26");
    assert.equal(previewed.preview.examples?.student, "AAAS/00001/26");
    assert.equal(previewed.preview.examples?.staff, "AAAF/00001/26");

    const claimed = await claim({
      hostHeader: "app.e-school.et:3000",
      token,
    });
    assert.deepEqual(claimed, {
      ok: true,
      abbreviation: "AAA",
      slug: "north-hall",
      host: "north-hall.e-school.et",
    });
    assert.equal((await store.findAuthById(tenant.id))?.tenant.abbreviation, "AAA");

    const second = await claim({
      hostHeader: "app.e-school.et:3000",
      token,
    });
    assert.equal(second.ok, false);
    if (!second.ok) {
      assert.equal(second.status, 403);
    }
  });

  it("rejects a custom code already taken", async () => {
    const first = await seedAfterUsername();
    const taken = await first.claim({
      hostHeader: "app.e-school.et:3000",
      token: first.token,
      abbreviation: "ABC",
    });
    assert.equal(taken.ok, true);

    const second = await seedAfterUsername();
    await second.store.claimAbbreviation({
      id: second.tenant.id,
      abbreviation: "NOPE",
    });
    const other = await first.store.insertPending({
      name: "East Yard",
      email: "head@east-yard.et",
      passwordHash: "hash:kept-password",
      founded: "Founded 2026",
    });
    assert.equal(other.ok, true);
    if (!other.ok) {
      return;
    }
    await first.store.updatePassword({
      id: other.tenant.id,
      passwordHash: "hash:kept-password",
      mustChangePassword: false,
    });
    await first.store.claimSlug({ id: other.tenant.id, slug: "east-yard" });
    const otherToken = sessions.issue({
      accountId: other.tenant.id,
      email: "head@east-yard.et",
    }).token;
    const claim = createClaimAppAbbreviation({
      rootHost: "e-school.et",
      tenants: first.store,
      sessions,
    });
    const conflict = await claim({
      hostHeader: "app.e-school.et:3000",
      token: otherToken,
      abbreviation: "abc",
    });
    assert.deepEqual(conflict, {
      ok: false,
      status: 409,
      error: ABBREVIATION_TAKEN,
    });
  });

  it("rejects a campus host", async () => {
    const { claim, token } = await seedAfterUsername();
    const result = await claim({
      hostHeader: "north-hall.e-school.et:3000",
      token,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 403);
    }
  });
});
