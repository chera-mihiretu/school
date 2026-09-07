import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryTenantStore } from "../tenants/memory-tenant-store.ts";
import { createHmacSchoolSessionSigner } from "../../infrastructure/auth/hmac-school-session.ts";
import { createReadSchoolAccountSession } from "./read-session.ts";

const sessions = createHmacSchoolSessionSigner({
  secret: "a-very-long-session-secret-value",
  ttlSeconds: 3600,
  now: () => new Date("2026-09-06T12:00:00.000Z"),
});

async function seedPending(input?: {
  status?: "pending_setup" | "active" | "suspended";
}) {
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
  if (input?.status === "suspended") {
    await store.setStatus(inserted.tenant.id, "suspended");
  }
  const issued = sessions.issue({
    accountId: inserted.tenant.id,
    email: "head@north-hall.et",
  });
  return {
    tenant: inserted.tenant,
    token: issued.token,
    readSession: createReadSchoolAccountSession({
      rootHost: "e-school.et",
      store,
      sessions,
    }),
  };
}

describe("createReadSchoolAccountSession", () => {
  it("returns the current session on the app host", async () => {
    const { readSession, tenant, token } = await seedPending();
    const result = await readSession({
      token,
      hostHeader: "app.e-school.et:3000",
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.session.accountId, tenant.id);
    assert.equal(result.session.email, "head@north-hall.et");
    assert.equal(result.session.mustChangePassword, true);
    assert.equal(result.session.nextStep, "password");
  });

  it("rejects a session minted before the account was suspended", async () => {
    const { readSession, token } = await seedPending({ status: "suspended" });
    const result = await readSession({
      token,
      hostHeader: "app.e-school.et:3000",
    });
    assert.deepEqual(result, {
      ok: false,
      status: 403,
      error: "This school account is suspended",
    });
  });
});
