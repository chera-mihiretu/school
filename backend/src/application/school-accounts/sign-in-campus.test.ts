import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryStaffStore } from "../staff/memory-staff-store.ts";
import { createMemoryStudentStore } from "../students/memory-student-store.ts";
import { createMemoryTeacherStore } from "../teachers/memory-teacher-store.ts";
import { createMemoryTenantStore } from "../tenants/memory-tenant-store.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import { createHmacSchoolSessionSigner } from "../../infrastructure/auth/hmac-school-session.ts";
import { createHmacSessionSigner } from "../../infrastructure/auth/hmac-session.ts";
import { createReadCampusAccountSession } from "./read-campus-session.ts";
import { createSignInCampusAccount } from "./sign-in-campus.ts";
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

async function seedCampus() {
  const store = createMemoryTenantStore();
  const teachers = createMemoryTeacherStore();
  const staffs = createMemoryStaffStore();
  const students = createMemoryStudentStore();
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

  await store.updatePassword({
    id: inserted.tenant.id,
    passwordHash: "hash:a-kept-password",
    mustChangePassword: false,
  });
  const claimed = await store.claimSlug({
    id: inserted.tenant.id,
    slug: "north-hall",
  });
  assert.equal(claimed.ok, true);
  const abbreviated = await store.claimAbbreviation({
    id: inserted.tenant.id,
    abbreviation: "AAA",
  });
  assert.equal(abbreviated.ok, true);

  return {
    store,
    teachers,
    staffs,
    students,
    tenant: inserted.tenant,
    signIn: createSignInCampusAccount({
      rootHost: "e-school.et",
      store,
      teachers,
      staffs,
      students,
      hasher,
      sessions,
    }),
    appSignIn: createSignInSchoolAccount({
      rootHost: "e-school.et",
      store,
      hasher,
      sessions,
    }),
    read: createReadCampusAccountSession({
      rootHost: "e-school.et",
      store,
      teachers,
      staffs,
      students,
      sessions,
    }),
  };
}

describe("createSignInCampusAccount", () => {
  it("signs in with the new password on the campus host", async () => {
    const { signIn, tenant, read } = await seedCampus();
    const result = await signIn({
      identifier: "Head@North-Hall.et",
      password: "a-kept-password",
      hostHeader: "north-hall.e-school.et:3000",
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.session.accountId, tenant.id);
    assert.equal(result.session.email, "head@north-hall.et");
    assert.equal(result.session.slug, "north-hall");
    assert.equal(result.session.host, "north-hall.e-school.et");
    assert.equal(result.session.kind, "director");
    assert.equal(result.session.mustChangePassword, false);

    const current = await read({
      token: result.session.token,
      hostHeader: "north-hall.e-school.et:3000",
    });
    assert.equal(current.ok, true);
  });

  it("rejects the same credentials on the app host after claim", async () => {
    const { appSignIn } = await seedCampus();
    const result = await appSignIn({
      email: "head@north-hall.et",
      password: "a-kept-password",
      hostHeader: "app.e-school.et:3000",
    });
    assert.deepEqual(result, {
      ok: false,
      status: 403,
      error: "Use your campus host",
    });
  });

  it("rejects an admin session token on the campus host", async () => {
    const { read } = await seedCampus();
    const admin = createHmacSessionSigner({
      secret: "a-very-long-session-secret-value",
      ttlSeconds: 3600,
      now: () => new Date("2026-09-06T12:00:00.000Z"),
    });
    const issued = admin.issue("admin@e-school.et");
    const result = await read({
      token: issued.token,
      hostHeader: "north-hall.e-school.et:3000",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 401);
    }
  });

  it("rejects the app host for campus sign-in", async () => {
    const { signIn } = await seedCampus();
    const result = await signIn({
      identifier: "head@north-hall.et",
      password: "a-kept-password",
      hostHeader: "app.e-school.et:3000",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 403);
    }
  });

  it("signs in a teacher on this campus and not as the director", async () => {
    const { signIn, teachers, read } = await seedCampus();
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

    const result = await signIn({
      identifier: "Abebe@North-Hall.et",
      password: "teacher-temp-1",
      hostHeader: "north-hall.e-school.et:3000",
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.session.kind, "teacher");
    assert.equal(result.session.accountId, inserted.teacher.id);
    assert.equal(result.session.email, "abebe@north-hall.et");
    assert.equal(result.session.mustChangePassword, true);
    assert.equal(result.session.slug, "north-hall");

    const after = await teachers.findById("north-hall", inserted.teacher.id);
    assert.ok(after?.signedInAt instanceof Date);

    const current = await read({
      token: result.session.token,
      hostHeader: "north-hall.e-school.et:3000",
    });
    assert.equal(current.ok, true);
    if (current.ok) {
      assert.equal(current.session.kind, "teacher");
      assert.equal(current.session.mustChangePassword, true);
    }

    const directorPassword = await signIn({
      identifier: "abebe@north-hall.et",
      password: "a-kept-password",
      hostHeader: "north-hall.e-school.et:3000",
    });
    assert.equal(directorPassword.ok, false);
    if (!directorPassword.ok) {
      assert.equal(directorPassword.status, 401);
    }
  });

  it("does not leak a teacher from another tenant schema", async () => {
    const { signIn, teachers } = await seedCampus();
    const inserted = await teachers.insert("east-yard", {
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

    const result = await signIn({
      identifier: "abebe@north-hall.et",
      password: "teacher-temp-1",
      hostHeader: "north-hall.e-school.et:3000",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 401);
    }
  });

  it("rejects a wrong campus host for that account", async () => {
    const { signIn } = await seedCampus();
    const result = await signIn({
      identifier: "head@north-hall.et",
      password: "a-kept-password",
      hostHeader: "east-yard.e-school.et:3000",
    });
    assert.deepEqual(result, {
      ok: false,
      status: 403,
      error: "Use your campus host",
    });
  });

  it("signs in a teacher with a printed school ID", async () => {
    const { signIn, teachers } = await seedCampus();
    const inserted = await teachers.insert("north-hall", {
      givenName: "Abebe",
      fatherName: "Bekele",
      grandfatherName: "Tesfaye",
      sex: "male",
      phone: "+251912345678",
      email: "abebe@north-hall.et",
      employeeId: "AAAT/00001/26",
      passwordHash: "hash:teacher-temp-1",
    });
    assert.equal(inserted.ok, true);
    if (!inserted.ok) {
      return;
    }

    const result = await signIn({
      identifier: " aaat / 00001 / 26 ",
      password: "teacher-temp-1",
      hostHeader: "north-hall.e-school.et:3000",
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.session.kind, "teacher");
    assert.equal(result.session.accountId, inserted.teacher.id);
    assert.equal(result.session.email, "abebe@north-hall.et");
  });

  it("signs in a student with a printed school ID", async () => {
    const { signIn, students, read } = await seedCampus();
    const inserted = await students.insert("north-hall", {
      givenName: "Lidya",
      fatherName: "Bekele",
      grandfatherName: "Tessema",
      sex: "female",
      phone: null,
      email: "lidya@north-hall.et",
      employeeId: "AAAS/00001/26",
      passwordHash: "hash:student-temp-1",
    });
    assert.equal(inserted.ok, true);
    if (!inserted.ok) {
      return;
    }

    const result = await signIn({
      identifier: "AAAS/00001/26",
      password: "student-temp-1",
      hostHeader: "north-hall.e-school.et:3000",
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.session.kind, "student");
    assert.equal(result.session.accountId, inserted.student.id);
    assert.equal(result.session.email, "lidya@north-hall.et");

    const session = await read({
      token: result.session.token,
      hostHeader: "north-hall.e-school.et:3000",
    });
    assert.equal(session.ok, true);
    if (session.ok) {
      assert.equal(session.session.kind, "student");
    }
  });

  it("signs in a staff member with a printed school ID", async () => {
    const { signIn, staffs, read } = await seedCampus();
    const inserted = await staffs.insert("north-hall", {
      givenName: "Hana",
      fatherName: "Bekele",
      grandfatherName: "Tessema",
      sex: "female",
      phone: "+251911223344",
      email: "hana@north-hall.et",
      employeeId: "AAAF/00001/26",
      passwordHash: "hash:staff-temp-1",
    });
    assert.equal(inserted.ok, true);
    if (!inserted.ok) {
      return;
    }

    const result = await signIn({
      identifier: " aaaf / 00001 / 26 ",
      password: "staff-temp-1",
      hostHeader: "north-hall.e-school.et:3000",
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.session.kind, "staff");
    assert.equal(result.session.accountId, inserted.staff.id);
    assert.equal(result.session.email, "hana@north-hall.et");
    assert.equal(result.session.mustChangePassword, true);

    const current = await read({
      token: result.session.token,
      hostHeader: "north-hall.e-school.et:3000",
    });
    assert.equal(current.ok, true);
    if (current.ok) {
      assert.equal(current.session.kind, "staff");
    }
  });
});
