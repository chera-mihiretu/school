import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MailerPort, MailerSendInput } from "../../domain/ports/mailer-port.ts";
import type { PasswordGeneratorPort } from "../../domain/ports/password-generator-port.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import { STAFF_EMAIL_UNAVAILABLE } from "../../domain/staff/staff.ts";
import { createHmacSchoolSessionSigner } from "../../infrastructure/auth/hmac-school-session.ts";
import { createMemoryTenantStore } from "../tenants/memory-tenant-store.ts";
import { createMemoryTeacherStore } from "../teachers/memory-teacher-store.ts";
import { createMemoryStudentStore } from "../students/memory-student-store.ts";
import { createCreateStaff } from "./create-staff.ts";
import { createMemoryStaffStore } from "./memory-staff-store.ts";

const TEMP_PASSWORD = "temp-password-16x";
const ADMIN_EMAIL = "admin@e-school.et";
const CAMPUS = "north-hall.e-school.et:3000";

const hasher: PasswordHasherPort = {
  async hash(password) {
    return `hash:${password}`;
  },
  async verify(passwordHash, password) {
    return passwordHash === `hash:${password}`;
  },
};

const passwords: PasswordGeneratorPort = {
  generate() {
    return TEMP_PASSWORD;
  },
};

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

const sessions = createHmacSchoolSessionSigner({
  secret: "a-very-long-session-secret-value",
  ttlSeconds: 3600,
  now: () => new Date("2026-09-07T12:00:00.000Z"),
});

const validBody = {
  givenName: "  Hana  ",
  fatherName: "Bekele",
  grandfatherName: "Tessema",
  sex: "female",
  phone: "0911223344",
  email: "  Hana@North-Hall.et ",
};

async function seedDirector(mailer = testMailer()) {
  const tenants = createMemoryTenantStore();
  const staffs = createMemoryStaffStore();
  const teachers = createMemoryTeacherStore();
  const students = createMemoryStudentStore();
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
  const abbreviated = await tenants.claimAbbreviation({
    id: inserted.tenant.id,
    abbreviation: "AAA",
  });
  assert.equal(abbreviated.ok, true);
  const token = sessions.issue({
    accountId: inserted.tenant.id,
    email: "head@north-hall.et",
    kind: "director",
  }).token;

  return {
    tenants,
    staffs,
    teachers,
    token,
    tenantId: inserted.tenant.id,
    mailer,
    create: createCreateStaff({
      rootHost: "e-school.et",
      adminEmail: ADMIN_EMAIL,
      publicUrls,
      tenants,
      staffs,
      teachers,
      students,
      hasher,
      mailer,
      passwords,
      sessions,
      now: () => new Date("2026-09-07T12:00:00.000Z"),
    }),
  };
}

describe("createCreateStaff", () => {
  it("creates a staff member with campus credentials", async () => {
    const { create, mailer, token } = await seedDirector();
    const result = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.staff.givenName, "Hana");
    assert.equal(result.staff.displayName, "Hana Bekele Tessema");
    assert.equal(result.staff.phone, "+251911223344");
    assert.equal(result.staff.email, "hana@north-hall.et");
    assert.equal(result.staff.employeeId, "AAAF/00001/26");
    assert.equal(result.staff.mustChangePassword, true);
    assert.equal(result.credentials.password, TEMP_PASSWORD);
    assert.equal(result.credentials.schoolId, "AAAF/00001/26");
    assert.equal(
      result.credentials.loginUrl,
      "http://north-hall.e-school.et:3000/login?email=hana%40north-hall.et",
    );
    assert.equal(result.emailSent, true);
    assert.equal(mailer.calls.length, 1);
    assert.match(mailer.calls[0]?.text ?? "", /Staff account/);
    assert.match(mailer.calls[0]?.text ?? "", /AAAF\/00001\/26/);
    assert.doesNotMatch(mailer.calls[0]?.text ?? "", /Teacher account/);
    assert.doesNotMatch(mailer.calls[0]?.text ?? "", /username/i);
  });

  it("still returns credentials when SMTP fails", async () => {
    const { create, token } = await seedDirector(testMailer(true));
    const result = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.emailSent, false);
    assert.equal(result.emailError, "SMTP refused the message");
    assert.equal(result.credentials.password, TEMP_PASSWORD);
  });

  it("rejects a taken staff email, teacher email, director email, and admin email", async () => {
    const { create, teachers, token } = await seedDirector();
    const first = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
    });
    assert.equal(first.ok, true);

    const taken = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
      email: "HANA@north-hall.et",
    });
    assert.equal(taken.ok, false);
    if (!taken.ok) {
      assert.equal(taken.status, 409);
      assert.equal(taken.error, STAFF_EMAIL_UNAVAILABLE);
    }

    const teacherInserted = await teachers.insert("north-hall", {
      givenName: "Abebe",
      fatherName: "Bekele",
      grandfatherName: "Tesfaye",
      sex: "male",
      phone: "+251912345678",
      email: "abebe@north-hall.et",
      employeeId: "AAAT/00001/26",
      passwordHash: "hash:teacher-temp-1",
    });
    assert.equal(teacherInserted.ok, true);

    const teacherEmail = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
      email: "Abebe@North-Hall.et",
    });
    assert.equal(teacherEmail.ok, false);
    if (!teacherEmail.ok) {
      assert.equal(teacherEmail.status, 409);
      assert.equal(teacherEmail.error, STAFF_EMAIL_UNAVAILABLE);
    }

    const director = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
      email: "Head@North-Hall.et",
    });
    assert.equal(director.ok, false);
    if (!director.ok) {
      assert.equal(director.status, 409);
      assert.equal(director.error, STAFF_EMAIL_UNAVAILABLE);
    }

    const admin = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
      email: "  Admin@E-School.et ",
    });
    assert.equal(admin.ok, false);
    if (!admin.ok) {
      assert.equal(admin.status, 409);
      assert.equal(admin.error, STAFF_EMAIL_UNAVAILABLE);
      assert.doesNotMatch(admin.error, /admin|operator|console/i);
    }
  });

  it("rejects a teacher session on director staff routes", async () => {
    const { create, teachers } = await seedDirector();
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
    const teacherToken = sessions.issue({
      accountId: inserted.teacher.id,
      email: "abebe@north-hall.et",
      kind: "teacher",
    }).token;
    const result = await create({
      hostHeader: CAMPUS,
      token: teacherToken,
      ...validBody,
      email: "other@north-hall.et",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 403);
    }
  });

  it("rejects a staff session on director staff routes", async () => {
    const { create, staffs } = await seedDirector();
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
    const staffToken = sessions.issue({
      accountId: inserted.staff.id,
      email: "hana@north-hall.et",
      kind: "staff",
    }).token;
    const result = await create({
      hostHeader: CAMPUS,
      token: staffToken,
      ...validBody,
      email: "other@north-hall.et",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 403);
    }
  });
});
