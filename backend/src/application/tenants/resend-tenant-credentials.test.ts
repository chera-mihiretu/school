import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MailerPort, MailerSendInput } from "../../domain/ports/mailer-port.ts";
import type { PasswordGeneratorPort } from "../../domain/ports/password-generator-port.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import { createMemoryTenantStore } from "./memory-tenant-store.ts";
import { createResendTenantCredentials } from "./resend-tenant-credentials.ts";

function testHasher(): PasswordHasherPort {
  return {
    async hash(password) {
      return `hash:${password}`;
    },
    async verify(passwordHash, password) {
      return passwordHash === `hash:${password}`;
    },
  };
}

function sequentialPasswords(values: string[]): PasswordGeneratorPort {
  let index = 0;
  return {
    generate() {
      const next = values[index];
      index += 1;
      if (next === undefined) {
        throw new Error("password generator exhausted");
      }
      return next;
    },
  };
}

const publicUrls: PublicUrlPort = {
  publicUrl({ label, path } = {}) {
    const authority =
      label === undefined || label.length === 0
        ? "e-school.et:3000"
        : `${label}.e-school.et:3000`;
    if (path === undefined || path.length === 0) {
      return `http://${authority}`;
    }
    return `http://${authority}${path.startsWith("/") ? path : `/${path}`}`;
  },
};

function testMailer(fail = false): MailerPort & { calls: MailerSendInput[] } {
  const calls: MailerSendInput[] = [];
  return {
    calls,
    async send(input) {
      calls.push(input);
      if (fail) {
        return { ok: false, error: "SMTP refused the message" };
      }
      return { ok: true };
    },
  };
}

async function seedPending(store = createMemoryTenantStore()) {
  const inserted = await store.insertPending({
    name: "North Hall",
    email: "head@north-hall.et",
    passwordHash: "hash:old-temp-password",
    founded: "Founded 2026",
  });
  assert.equal(inserted.ok, true);
  if (!inserted.ok) {
    throw new Error("insert failed");
  }
  return { store, tenant: inserted.tenant };
}

describe("createResendTenantCredentials", () => {
  it("resets the hash so the old password fails verify", async () => {
    const hasher = testHasher();
    const { store, tenant } = await seedPending();
    const resend = createResendTenantCredentials({
      rootHost: "e-school.et",
      publicUrls,
      store,
      hasher,
      mailer: testMailer(),
      passwords: sequentialPasswords(["new-temp-password"]),
    });

    const result = await resend({
      hostHeader: "admin.e-school.et",
      id: tenant.id,
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    const auth = await store.findAuthById(tenant.id);
    assert.ok(auth);
    assert.equal(await hasher.verify(auth.passwordHash, "old-temp-password"), false);
    assert.equal(await hasher.verify(auth.passwordHash, "new-temp-password"), true);
    assert.equal(result.credentials.password, "new-temp-password");
    assert.equal(result.credentials.email, "head@north-hall.et");
    assert.equal(result.emailSent, true);
    assert.equal(result.school.lastMailOk, true);
    assert.equal(auth.tenant.mustChangePassword, true);
  });

  it("returns 409 when the slug is already claimed", async () => {
    const { store, tenant } = await seedPending();
    const claimed = await store.claimSlug({
      id: tenant.id,
      slug: "north-hall",
    });
    assert.equal(claimed.ok, true);

    const resend = createResendTenantCredentials({
      rootHost: "e-school.et",
      publicUrls,
      store,
      hasher: testHasher(),
      mailer: testMailer(),
      passwords: sequentialPasswords(["new-temp-password"]),
    });

    const result = await resend({
      hostHeader: "admin.e-school.et",
      id: tenant.id,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 409);
    }

    const auth = await store.findAuthById(tenant.id);
    assert.equal(auth?.passwordHash, "hash:old-temp-password");
  });

  it("still returns credentials when mail fails and records lastMailOk", async () => {
    const { store, tenant } = await seedPending();
    const resend = createResendTenantCredentials({
      rootHost: "e-school.et",
      publicUrls,
      store,
      hasher: testHasher(),
      mailer: testMailer(true),
      passwords: sequentialPasswords(["new-temp-password"]),
    });

    const result = await resend({
      hostHeader: "admin.e-school.et",
      id: tenant.id,
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.emailSent, false);
    assert.equal(result.emailError, "SMTP refused the message");
    assert.equal(result.credentials.password, "new-temp-password");
    assert.equal(result.school.lastMailOk, false);
    assert.equal(result.school.lastMailError, "SMTP refused the message");

    const stored = await store.findByEmail("head@north-hall.et");
    assert.equal(stored?.lastMailOk, false);
    assert.equal(stored?.lastMailError, "SMTP refused the message");
    assert.ok(stored?.lastMailAt instanceof Date);
  });

  it("returns 409 when the tenant is suspended", async () => {
    const { store, tenant } = await seedPending();
    await store.setStatus(tenant.id, "suspended");

    const resend = createResendTenantCredentials({
      rootHost: "e-school.et",
      publicUrls,
      store,
      hasher: testHasher(),
      mailer: testMailer(),
      passwords: sequentialPasswords(["new-temp-password"]),
    });

    const result = await resend({
      hostHeader: "admin.e-school.et",
      id: tenant.id,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 409);
    }
  });

  it("returns 404 when the tenant is missing", async () => {
    const resend = createResendTenantCredentials({
      rootHost: "e-school.et",
      publicUrls,
      store: createMemoryTenantStore(),
      hasher: testHasher(),
      mailer: testMailer(),
      passwords: sequentialPasswords(["new-temp-password"]),
    });

    const result = await resend({
      hostHeader: "admin.e-school.et",
      id: "11111111-1111-1111-1111-111111111111",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 404);
    }
  });
});
