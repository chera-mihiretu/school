import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MailerPort } from "../../domain/ports/mailer-port.ts";
import type { PasswordGeneratorPort } from "../../domain/ports/password-generator-port.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import { createHmacSchoolSessionSigner } from "../../infrastructure/auth/hmac-school-session.ts";
import { createMemoryTenantStore } from "../tenants/memory-tenant-store.ts";
import { createMemoryTeacherStore } from "./memory-teacher-store.ts";
import {
  createResendTeacherCredentials,
  TEACHER_RESEND_LOCKED,
} from "./resend-teacher-credentials.ts";

const hasher: PasswordHasherPort = {
  async hash(password) {
    return `hash:${password}`;
  },
  async verify(passwordHash, password) {
    return passwordHash === `hash:${password}`;
  },
};

const publicUrls: PublicUrlPort = {
  publicUrl({ label, path } = {}) {
    const authority =
      label === undefined || label.length === 0
        ? "e-school.et:3000"
        : `${label}.e-school.et:3000`;
    return `http://${authority}${path ?? ""}`;
  },
};

const mailer: MailerPort = {
  async send() {
    return { ok: true };
  },
};

const sessions = createHmacSchoolSessionSigner({
  secret: "a-very-long-session-secret-value",
  ttlSeconds: 3600,
  now: () => new Date("2026-09-07T12:00:00.000Z"),
});

describe("createResendTeacherCredentials", () => {
  it("issues a new temp password while mustChangePassword is true, then 409", async () => {
    const tenants = createMemoryTenantStore();
    const teachers = createMemoryTeacherStore();
    const pending = await tenants.insertPending({
      name: "North Hall",
      email: "head@north-hall.et",
      passwordHash: "hash:a-kept-password",
      founded: "Founded 2026",
    });
    assert.equal(pending.ok, true);
    if (!pending.ok) {
      return;
    }
    await tenants.updatePassword({
      id: pending.tenant.id,
      passwordHash: "hash:a-kept-password",
      mustChangePassword: false,
    });
    await tenants.claimSlug({ id: pending.tenant.id, slug: "north-hall" });
    const inserted = await teachers.insert("north-hall", {
      givenName: "Abebe",
      fatherName: "Bekele",
      grandfatherName: "Tesfaye",
      sex: "male",
      phone: "+251912345678",
      email: "abebe@north-hall.et",
      employeeId: null,
      passwordHash: "hash:old-temp",
    });
    assert.equal(inserted.ok, true);
    if (!inserted.ok) {
      return;
    }

    let generated = "new-temp-aaaa";
    const passwords: PasswordGeneratorPort = {
      generate() {
        return generated;
      },
    };
    const resend = createResendTeacherCredentials({
      rootHost: "e-school.et",
      publicUrls,
      tenants,
      teachers,
      hasher,
      mailer,
      passwords,
      sessions,
    });
    const token = sessions.issue({
      accountId: pending.tenant.id,
      email: "head@north-hall.et",
      kind: "director",
    }).token;

    const first = await resend({
      hostHeader: "north-hall.e-school.et:3000",
      token,
      id: inserted.teacher.id,
    });
    assert.equal(first.ok, true);
    if (!first.ok) {
      return;
    }
    assert.equal(first.credentials.password, "new-temp-aaaa");
    const auth = await teachers.findAuthById("north-hall", inserted.teacher.id);
    assert.equal(auth?.passwordHash, "hash:new-temp-aaaa");
    assert.equal(await hasher.verify(auth?.passwordHash ?? "", "old-temp"), false);

    await teachers.updatePassword("north-hall", {
      id: inserted.teacher.id,
      passwordHash: "hash:a-kept-password",
      mustChangePassword: false,
    });
    generated = "another-temp";
    const locked = await resend({
      hostHeader: "north-hall.e-school.et:3000",
      token,
      id: inserted.teacher.id,
    });
    assert.equal(locked.ok, false);
    if (!locked.ok) {
      assert.equal(locked.status, 409);
      assert.equal(locked.error, TEACHER_RESEND_LOCKED);
    }
  });
});
