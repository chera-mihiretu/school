import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MailerPort, MailerSendInput } from "../../domain/ports/mailer-port.ts";
import type { PasswordGeneratorPort } from "../../domain/ports/password-generator-port.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import { TENANT_EMAIL_UNAVAILABLE } from "../../domain/tenants/tenant.ts";
import { createCreateTenant } from "./create-tenant.ts";
import { createMemoryTenantStore } from "./memory-tenant-store.ts";

const TEMP_PASSWORD = "temp-password-16x";
const ADMIN_EMAIL = "admin@e-school.et";

function testHasher(): PasswordHasherPort & { hashed: string[] } {
  const hashed: string[] = [];
  return {
    hashed,
    async hash(password) {
      hashed.push(password);
      return `hash:${password}`;
    },
    async verify(passwordHash, password) {
      return passwordHash === `hash:${password}`;
    },
  };
}

function testPasswords(): PasswordGeneratorPort {
  return {
    generate() {
      return TEMP_PASSWORD;
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

describe("createCreateTenant", () => {
  it("creates a pending school with name and email only", async () => {
    const hasher = testHasher();
    const mailer = testMailer();
    const create = createCreateTenant({
      rootHost: "e-school.et",
      adminEmail: ADMIN_EMAIL,
      publicUrls,
      store: createMemoryTenantStore(),
      hasher,
      mailer,
      passwords: testPasswords(),
    });

    const result = await create({
      hostHeader: "admin.e-school.et",
      name: "  North Hall  ",
      email: "  Head@North-Hall.et ",
    });

    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.school.name, "North Hall");
    assert.equal(result.school.email, "head@north-hall.et");
    assert.equal(result.school.slug, null);
    assert.equal(result.school.username, null);
    assert.equal(result.school.host, null);
    assert.equal(result.school.status, "pending_setup");
    assert.equal(result.school.mustChangePassword, true);
    assert.deepEqual(hasher.hashed, [TEMP_PASSWORD]);
    assert.equal(
      await hasher.verify(`hash:${TEMP_PASSWORD}`, result.credentials.password),
      true,
    );
    assert.equal(result.credentials.email, "head@north-hall.et");
    assert.equal(result.credentials.password, TEMP_PASSWORD);
    assert.equal(
      result.credentials.firstLoginUrl,
      "http://app.e-school.et:3000/first-login?email=head%40north-hall.et",
    );
    assert.equal(result.emailSent, true);
    assert.equal(result.school.lastMailOk, true);
    assert.equal(result.school.lastMailError, null);
    assert.ok(result.school.lastMailAt !== null);
    assert.equal(mailer.calls.length, 1);
    const sent = mailer.calls[0];
    assert.ok(sent);
    assert.equal(sent.to, "head@north-hall.et");
    assert.match(
      sent.text,
      /http:\/\/app\.e-school\.et:3000\/first-login\?email=head%40north-hall\.et/,
    );
    assert.doesNotMatch(sent.text, /https:\/\/app\./);
    assert.match(sent.text, /temp-password-16x/);
    assert.ok(typeof sent.html === "string");
    assert.match(
      sent.html,
      /http:\/\/app\.e-school\.et:3000\/first-login\?email=head%40north-hall\.et/,
    );
    assert.doesNotMatch(sent.html, /https:\/\/app\./);
  });

  it("still succeeds when the mailer fails", async () => {
    const create = createCreateTenant({
      rootHost: "e-school.et",
      adminEmail: ADMIN_EMAIL,
      publicUrls,
      store: createMemoryTenantStore(),
      hasher: testHasher(),
      mailer: testMailer(true),
      passwords: testPasswords(),
    });

    const result = await create({
      hostHeader: "admin.e-school.et",
      name: "North Hall",
      email: "head@north-hall.et",
    });

    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.emailSent, false);
    assert.equal(result.emailError, "SMTP refused the message");
    assert.equal(result.credentials.password, TEMP_PASSWORD);
    assert.equal(result.school.status, "pending_setup");
    assert.equal(result.school.lastMailOk, false);
    assert.equal(result.school.lastMailError, "SMTP refused the message");
    assert.ok(result.school.lastMailAt !== null);
  });

  it("rejects an invalid email", async () => {
    const create = createCreateTenant({
      rootHost: "e-school.et",
      adminEmail: ADMIN_EMAIL,
      publicUrls,
      store: createMemoryTenantStore(),
      hasher: testHasher(),
      mailer: testMailer(),
      passwords: testPasswords(),
    });

    const missing = await create({
      hostHeader: "admin.e-school.et",
      name: "North Hall",
      email: "",
    });
    assert.equal(missing.ok, false);
    if (!missing.ok) {
      assert.equal(missing.status, 400);
      assert.match(missing.error, /email/i);
    }

    const invalid = await create({
      hostHeader: "admin.e-school.et",
      name: "North Hall",
      email: "not-an-email",
    });
    assert.equal(invalid.ok, false);
    if (!invalid.ok) {
      assert.equal(invalid.status, 400);
    }
  });

  it("rejects a duplicate email before sending mail", async () => {
    const mailer = testMailer();
    const hasher = testHasher();
    const create = createCreateTenant({
      rootHost: "e-school.et",
      adminEmail: ADMIN_EMAIL,
      publicUrls,
      store: createMemoryTenantStore(),
      hasher,
      mailer,
      passwords: testPasswords(),
    });

    const first = await create({
      hostHeader: "admin.e-school.et",
      name: "North Hall",
      email: "head@north-hall.et",
    });
    assert.equal(first.ok, true);
    assert.equal(mailer.calls.length, 1);
    assert.deepEqual(hasher.hashed, [TEMP_PASSWORD]);

    const duplicate = await create({
      hostHeader: "admin.e-school.et",
      name: "North Hall Two",
      email: "Head@North-Hall.et",
    });
    assert.equal(duplicate.ok, false);
    if (!duplicate.ok) {
      assert.equal(duplicate.status, 409);
      assert.equal(duplicate.error, TENANT_EMAIL_UNAVAILABLE);
    }
    assert.equal(mailer.calls.length, 1);
    assert.deepEqual(hasher.hashed, [TEMP_PASSWORD]);
  });

  it("rejects the platform admin email before sending mail", async () => {
    const mailer = testMailer();
    const hasher = testHasher();
    const create = createCreateTenant({
      rootHost: "e-school.et",
      adminEmail: ADMIN_EMAIL,
      publicUrls,
      store: createMemoryTenantStore(),
      hasher,
      mailer,
      passwords: testPasswords(),
    });

    const result = await create({
      hostHeader: "admin.e-school.et",
      name: "North Hall",
      email: "  Admin@E-School.et ",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 409);
      assert.equal(result.error, TENANT_EMAIL_UNAVAILABLE);
      assert.doesNotMatch(result.error, /admin|operator|console/i);
    }
    assert.equal(mailer.calls.length, 0);
    assert.deepEqual(hasher.hashed, []);
  });

  it("maps a unique-index race to the same generic error without sending mail", async () => {
    const mailer = testMailer();
    const hasher = testHasher();
    const inner = createMemoryTenantStore();
    const store: TenantStorePort = {
      ...inner,
      async findByEmail() {
        return undefined;
      },
      async insertPending() {
        return { ok: false, reason: "email_taken" };
      },
    };
    const create = createCreateTenant({
      rootHost: "e-school.et",
      adminEmail: ADMIN_EMAIL,
      publicUrls,
      store,
      hasher,
      mailer,
      passwords: testPasswords(),
    });

    const result = await create({
      hostHeader: "admin.e-school.et",
      name: "North Hall",
      email: "head@north-hall.et",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 409);
      assert.equal(result.error, TENANT_EMAIL_UNAVAILABLE);
    }
    assert.equal(mailer.calls.length, 0);
  });

  it("rejects a non-admin host", async () => {
    const create = createCreateTenant({
      rootHost: "e-school.et",
      adminEmail: ADMIN_EMAIL,
      publicUrls,
      store: createMemoryTenantStore(),
      hasher: testHasher(),
      mailer: testMailer(),
      passwords: testPasswords(),
    });

    const fromSchool = await create({
      hostHeader: "demo.e-school.et",
      name: "Demo",
      email: "head@demo.et",
    });
    assert.equal(fromSchool.ok, false);
    if (!fromSchool.ok) {
      assert.equal(fromSchool.status, 403);
    }
  });
});
