import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryTenantStore } from "../tenants/memory-tenant-store.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import { createHmacSchoolSessionSigner } from "../../infrastructure/auth/hmac-school-session.ts";
import { createSignInSchoolAccount } from "./sign-in.ts";

const hasher: PasswordHasherPort = {
  async hash(password) {
    return `hash:${password}`;
  },
  async verify(passwordHash, password) {
    return passwordHash === `hash:${password}`;
  },
};

const sessions = createHmacSchoolSessionSigner({
  secret: "a-very-long-session-secret-value",
  ttlSeconds: 3600,
  now: () => new Date("2026-09-06T12:00:00.000Z"),
});

async function seedPending(input?: {
  email?: string;
  password?: string;
  status?: "pending_setup" | "active" | "suspended";
  slug?: string | null;
}) {
  const store = createMemoryTenantStore();
  const email = input?.email ?? "head@north-hall.et";
  const password = input?.password ?? "temporary-pass";
  const inserted = await store.insertPending({
    name: "North Hall",
    email,
    passwordHash: `hash:${password}`,
    founded: "Founded 2026",
  });
  assert.equal(inserted.ok, true);
  if (!inserted.ok) {
    throw new Error("insert failed");
  }
  if (input?.status === "suspended") {
    await store.setStatus(inserted.tenant.id, "suspended");
  }
  if (input?.slug !== undefined && input.slug !== null) {
    await store.claimSlug({ id: inserted.tenant.id, slug: input.slug });
  }
  return {
    store,
    tenant: inserted.tenant,
    signIn: createSignInSchoolAccount({
      rootHost: "e-school.et",
      store,
      hasher,
      sessions,
    }),
  };
}

describe("createSignInSchoolAccount", () => {
  it("signs in on the app host and asks for a password change", async () => {
    const { signIn, tenant } = await seedPending();
    const result = await signIn({
      email: "Head@North-Hall.et",
      password: "temporary-pass",
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
    assert.ok(result.session.token.length > 0);
  });

  it("records signedInAt on the first successful app sign-in", async () => {
    const { signIn, store, tenant } = await seedPending();
    const before = await store.findByEmail("head@north-hall.et");
    assert.equal(before?.signedInAt, null);

    const first = await signIn({
      email: "head@north-hall.et",
      password: "temporary-pass",
      hostHeader: "app.e-school.et:3000",
    });
    assert.equal(first.ok, true);

    const afterFirst = await store.findByEmail("head@north-hall.et");
    assert.ok(afterFirst?.signedInAt instanceof Date);
    const firstAt = afterFirst?.signedInAt;

    const second = await signIn({
      email: "head@north-hall.et",
      password: "temporary-pass",
      hostHeader: "app.e-school.et:3000",
    });
    assert.equal(second.ok, true);
    const afterSecond = await store.findByEmail(tenant.email ?? "");
    assert.deepEqual(afterSecond?.signedInAt, firstAt);
  });

  it("rejects a wrong password", async () => {
    const { signIn } = await seedPending();
    const result = await signIn({
      email: "head@north-hall.et",
      password: "wrong-password",
      hostHeader: "app.e-school.et:3000",
    });
    assert.deepEqual(result, {
      ok: false,
      status: 401,
      error: "Invalid email or password",
    });
  });

  it("rejects the admin host", async () => {
    const { signIn } = await seedPending();
    const result = await signIn({
      email: "head@north-hall.et",
      password: "temporary-pass",
      hostHeader: "admin.e-school.et:3000",
    });
    assert.equal(result.ok, false);
    if (result.ok) {
      return;
    }
    assert.equal(result.status, 403);
  });

  it("rejects a campus host", async () => {
    const { signIn } = await seedPending();
    const result = await signIn({
      email: "head@north-hall.et",
      password: "temporary-pass",
      hostHeader: "north-hall.e-school.et:3000",
    });
    assert.equal(result.ok, false);
    if (result.ok) {
      return;
    }
    assert.equal(result.status, 403);
  });

  it("rejects a suspended account", async () => {
    const { signIn } = await seedPending({ status: "suspended" });
    const result = await signIn({
      email: "head@north-hall.et",
      password: "temporary-pass",
      hostHeader: "app.e-school.et:3000",
    });
    assert.deepEqual(result, {
      ok: false,
      status: 403,
      error: "This school account is suspended",
    });
  });

  it("rejects an account that finished first-login", async () => {
    const { signIn, store, tenant } = await seedPending({ slug: "north-hall" });
    await store.updatePassword({
      id: tenant.id,
      passwordHash: "hash:temporary-pass",
      mustChangePassword: false,
    });
    const abbreviated = await store.claimAbbreviation({
      id: tenant.id,
      abbreviation: "AAA",
    });
    assert.equal(abbreviated.ok, true);
    const result = await signIn({
      email: "head@north-hall.et",
      password: "temporary-pass",
      hostHeader: "app.e-school.et:3000",
    });
    assert.deepEqual(result, {
      ok: false,
      status: 403,
      error: "Use your campus host",
    });
  });

  it("allows app sign-in after a slug until the abbreviation is saved", async () => {
    const { signIn, store, tenant } = await seedPending({ slug: "north-hall" });
    await store.updatePassword({
      id: tenant.id,
      passwordHash: "hash:temporary-pass",
      mustChangePassword: false,
    });
    const waiting = await signIn({
      email: "head@north-hall.et",
      password: "temporary-pass",
      hostHeader: "app.e-school.et:3000",
    });
    assert.equal(waiting.ok, true);
    if (waiting.ok) {
      assert.equal(waiting.session.nextStep, "abbreviation");
    }

    const locked = await store.claimAbbreviation({
      id: tenant.id,
      abbreviation: "AAA",
    });
    assert.equal(locked.ok, true);
    const result = await signIn({
      email: "head@north-hall.et",
      password: "temporary-pass",
      hostHeader: "app.e-school.et:3000",
    });
    assert.deepEqual(result, {
      ok: false,
      status: 403,
      error: "Use your campus host",
    });
  });
});
