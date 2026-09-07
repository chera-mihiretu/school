import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createHmacSchoolSessionSigner } from "../../infrastructure/auth/hmac-school-session.ts";
import { createMemoryStaffStore } from "../staff/memory-staff-store.ts";
import { createMemoryTenantStore } from "../tenants/memory-tenant-store.ts";
import { createMemoryTeacherStore } from "./memory-teacher-store.ts";
import {
  authorizeCampusDirector,
  authorizeCampusStaff,
  authorizeCampusTeacher,
  DIRECTOR_ONLY_ERROR,
  STAFF_ONLY_ERROR,
  TEACHER_ONLY_ERROR,
} from "./authorize-campus.ts";

const sessions = createHmacSchoolSessionSigner({
  secret: "a-very-long-session-secret-value",
  ttlSeconds: 3600,
  now: () => new Date("2026-09-07T12:00:00.000Z"),
});

async function seed() {
  const tenants = createMemoryTenantStore();
  const teachers = createMemoryTeacherStore();
  const staffs = createMemoryStaffStore();
  const inserted = await tenants.insertPending({
    name: "North Hall",
    email: "head@north-hall.et",
    passwordHash: "hash:a-kept-password",
    founded: "Founded 2026",
  });
  assert.equal(inserted.ok, true);
  if (!inserted.ok) {
    throw new Error("insert failed");
  }
  await tenants.updatePassword({
    id: inserted.tenant.id,
    passwordHash: "hash:a-kept-password",
    mustChangePassword: false,
  });
  await tenants.claimSlug({ id: inserted.tenant.id, slug: "north-hall" });
  const teacher = await teachers.insert("north-hall", {
    givenName: "Abebe",
    fatherName: "Bekele",
    grandfatherName: "Tesfaye",
    sex: "male",
    phone: "+251912345678",
    email: "abebe@north-hall.et",
    employeeId: "AAAT/00001/26",
    passwordHash: "hash:teacher-temp-1",
  });
  const staff = await staffs.insert("north-hall", {
    givenName: "Hana",
    fatherName: "Bekele",
    grandfatherName: "Tessema",
    sex: "female",
    phone: "+251911223344",
    email: "hana@north-hall.et",
    employeeId: "AAAF/00001/26",
    passwordHash: "hash:staff-temp-1",
  });
  assert.equal(teacher.ok, true);
  assert.equal(staff.ok, true);
  if (!teacher.ok || !staff.ok) {
    throw new Error("seed failed");
  }

  return {
    tenants,
    teachers,
    staffs,
    directorId: inserted.tenant.id,
    teacherId: teacher.teacher.id,
    staffId: staff.staff.id,
  };
}

describe("authorizeCampus kinds", () => {
  it("lets only a director use director routes", async () => {
    const { tenants, directorId, teacherId, staffId } = await seed();
    const director = await authorizeCampusDirector({
      hostHeader: "north-hall.e-school.et:3000",
      token: sessions.issue({
        accountId: directorId,
        email: "head@north-hall.et",
        kind: "director",
      }).token,
      rootHost: "e-school.et",
      tenants,
      sessions,
    });
    assert.equal(director.ok, true);

    const teacher = await authorizeCampusDirector({
      hostHeader: "north-hall.e-school.et:3000",
      token: sessions.issue({
        accountId: teacherId,
        email: "abebe@north-hall.et",
        kind: "teacher",
      }).token,
      rootHost: "e-school.et",
      tenants,
      sessions,
    });
    assert.equal(teacher.ok, false);
    if (!teacher.ok) {
      assert.equal(teacher.status, 403);
      assert.equal(teacher.error, DIRECTOR_ONLY_ERROR);
    }

    const staff = await authorizeCampusDirector({
      hostHeader: "north-hall.e-school.et:3000",
      token: sessions.issue({
        accountId: staffId,
        email: "hana@north-hall.et",
        kind: "staff",
      }).token,
      rootHost: "e-school.et",
      tenants,
      sessions,
    });
    assert.equal(staff.ok, false);
    if (!staff.ok) {
      assert.equal(staff.status, 403);
      assert.equal(staff.error, DIRECTOR_ONLY_ERROR);
    }
  });

  it("lets only a teacher change a teacher password", async () => {
    const { tenants, teachers, directorId, teacherId, staffId } = await seed();
    const teacher = await authorizeCampusTeacher({
      hostHeader: "north-hall.e-school.et:3000",
      token: sessions.issue({
        accountId: teacherId,
        email: "abebe@north-hall.et",
        kind: "teacher",
      }).token,
      rootHost: "e-school.et",
      tenants,
      teachers,
      sessions,
    });
    assert.equal(teacher.ok, true);

    const director = await authorizeCampusTeacher({
      hostHeader: "north-hall.e-school.et:3000",
      token: sessions.issue({
        accountId: directorId,
        email: "head@north-hall.et",
        kind: "director",
      }).token,
      rootHost: "e-school.et",
      tenants,
      teachers,
      sessions,
    });
    assert.equal(director.ok, false);
    if (!director.ok) {
      assert.equal(director.status, 403);
      assert.equal(director.error, TEACHER_ONLY_ERROR);
    }

    const staff = await authorizeCampusTeacher({
      hostHeader: "north-hall.e-school.et:3000",
      token: sessions.issue({
        accountId: staffId,
        email: "hana@north-hall.et",
        kind: "staff",
      }).token,
      rootHost: "e-school.et",
      tenants,
      teachers,
      sessions,
    });
    assert.equal(staff.ok, false);
    if (!staff.ok) {
      assert.equal(staff.status, 403);
      assert.equal(staff.error, TEACHER_ONLY_ERROR);
    }
  });

  it("lets only staff change a staff password", async () => {
    const { tenants, staffs, directorId, teacherId, staffId } = await seed();
    const staff = await authorizeCampusStaff({
      hostHeader: "north-hall.e-school.et:3000",
      token: sessions.issue({
        accountId: staffId,
        email: "hana@north-hall.et",
        kind: "staff",
      }).token,
      rootHost: "e-school.et",
      tenants,
      staffs,
      sessions,
    });
    assert.equal(staff.ok, true);

    const director = await authorizeCampusStaff({
      hostHeader: "north-hall.e-school.et:3000",
      token: sessions.issue({
        accountId: directorId,
        email: "head@north-hall.et",
        kind: "director",
      }).token,
      rootHost: "e-school.et",
      tenants,
      staffs,
      sessions,
    });
    assert.equal(director.ok, false);
    if (!director.ok) {
      assert.equal(director.status, 403);
      assert.equal(director.error, STAFF_ONLY_ERROR);
    }

    const teacher = await authorizeCampusStaff({
      hostHeader: "north-hall.e-school.et:3000",
      token: sessions.issue({
        accountId: teacherId,
        email: "abebe@north-hall.et",
        kind: "teacher",
      }).token,
      rootHost: "e-school.et",
      tenants,
      staffs,
      sessions,
    });
    assert.equal(teacher.ok, false);
    if (!teacher.ok) {
      assert.equal(teacher.status, 403);
      assert.equal(teacher.error, STAFF_ONLY_ERROR);
    }
  });
});
