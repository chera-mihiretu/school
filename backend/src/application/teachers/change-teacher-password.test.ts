import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import { createHmacSchoolSessionSigner } from "../../infrastructure/auth/hmac-school-session.ts";
import { createMemoryTenantStore } from "../tenants/memory-tenant-store.ts";
import {
  createChangeTeacherPassword,
  TEACHER_PASSWORD_ALREADY_CHANGED,
} from "./change-teacher-password.ts";
import { createMemoryTeacherStore } from "./memory-teacher-store.ts";

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
  now: () => new Date("2026-09-07T12:00:00.000Z"),
});

describe("createChangeTeacherPassword", () => {
  it("changes the first password and then rejects a second change", async () => {
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
      passwordHash: "hash:teacher-temp-1",
    });
    assert.equal(inserted.ok, true);
    if (!inserted.ok) {
      return;
    }

    const change = createChangeTeacherPassword({
      rootHost: "e-school.et",
      tenants,
      teachers,
      hasher,
      sessions,
    });
    const teacherToken = sessions.issue({
      accountId: inserted.teacher.id,
      email: "abebe@north-hall.et",
      kind: "teacher",
    }).token;
    const directorToken = sessions.issue({
      accountId: pending.tenant.id,
      email: "head@north-hall.et",
      kind: "director",
    }).token;

    const asDirector = await change({
      hostHeader: "north-hall.e-school.et:3000",
      token: directorToken,
      password: "a-kept-password",
    });
    assert.equal(asDirector.ok, false);
    if (!asDirector.ok) {
      assert.equal(asDirector.status, 403);
    }

    const same = await change({
      hostHeader: "north-hall.e-school.et:3000",
      token: teacherToken,
      password: "teacher-temp-1",
    });
    assert.equal(same.ok, false);
    if (!same.ok) {
      assert.equal(same.status, 400);
    }

    const changed = await change({
      hostHeader: "north-hall.e-school.et:3000",
      token: teacherToken,
      password: "a-kept-password",
    });
    assert.equal(changed.ok, true);
    if (changed.ok) {
      assert.equal(changed.teacher.mustChangePassword, false);
    }

    const again = await change({
      hostHeader: "north-hall.e-school.et:3000",
      token: teacherToken,
      password: "another-kept-1",
    });
    assert.equal(again.ok, false);
    if (!again.ok) {
      assert.equal(again.status, 409);
      assert.equal(again.error, TEACHER_PASSWORD_ALREADY_CHANGED);
    }
  });
});
