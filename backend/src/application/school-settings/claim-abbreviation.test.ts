import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ABBREVIATION_LOCKED } from "../../domain/school-abbreviation/abbreviation.ts";
import { createMemoryTenantStore } from "../tenants/memory-tenant-store.ts";
import { createHmacSchoolSessionSigner } from "../../infrastructure/auth/hmac-school-session.ts";
import { createClaimSettingsAbbreviation } from "./claim-abbreviation.ts";
import { createReadSettingsAbbreviation } from "./read-abbreviation.ts";

const sessions = createHmacSchoolSessionSigner({
  secret: "a-very-long-session-secret-value",
  ttlSeconds: 3600,
  now: () => new Date("2026-09-07T12:00:00.000Z"),
});

async function seedCampus() {
  const store = createMemoryTenantStore();
  const inserted = await store.insertPending({
    name: "Abdi Lemi",
    email: "head@abdilemi.et",
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
  await store.claimSlug({ id: inserted.tenant.id, slug: "abdilemi" });
  const token = sessions.issue({
    accountId: inserted.tenant.id,
    email: "head@abdilemi.et",
    kind: "director",
  }).token;
  return {
    store,
    tenant: inserted.tenant,
    token,
    read: createReadSettingsAbbreviation({
      rootHost: "e-school.et",
      tenants: store,
      sessions,
    }),
    claim: createClaimSettingsAbbreviation({
      rootHost: "e-school.et",
      tenants: store,
      sessions,
    }),
  };
}

describe("campus settings abbreviation", () => {
  it("saves once then rejects a second save", async () => {
    const { read, claim, token } = await seedCampus();
    const previewed = await read({
      hostHeader: "abdilemi.e-school.et:3000",
      token,
      now: new Date("2026-09-07T12:00:00.000Z"),
    });
    assert.equal(previewed.ok, true);
    if (!previewed.ok) {
      return;
    }
    assert.equal(previewed.preview.suggested, "AAA");
    assert.equal(previewed.preview.locked, false);

    const first = await claim({
      hostHeader: "abdilemi.e-school.et:3000",
      token,
      abbreviation: "ALS",
    });
    assert.deepEqual(first, { ok: true, abbreviation: "ALS", locked: true });

    const locked = await read({
      hostHeader: "abdilemi.e-school.et:3000",
      token,
      now: new Date("2026-09-07T12:00:00.000Z"),
    });
    assert.equal(locked.ok, true);
    if (!locked.ok) {
      return;
    }
    assert.equal(locked.preview.abbreviation, "ALS");
    assert.equal(locked.preview.locked, true);
    assert.equal(locked.preview.examples?.teacher, "ALST/00001/26");

    const second = await claim({
      hostHeader: "abdilemi.e-school.et:3000",
      token,
      abbreviation: "XYZ",
    });
    assert.deepEqual(second, {
      ok: false,
      status: 409,
      error: ABBREVIATION_LOCKED,
    });
  });

  it("rejects a teacher session", async () => {
    const { claim, tenant } = await seedCampus();
    const teacherToken = sessions.issue({
      accountId: tenant.id,
      email: "teacher@abdilemi.et",
      kind: "teacher",
    }).token;
    const result = await claim({
      hostHeader: "abdilemi.e-school.et:3000",
      token: teacherToken,
      abbreviation: "AAA",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 403);
    }
  });
});
