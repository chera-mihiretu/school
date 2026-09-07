import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MailerPort, MailerSendInput } from "../../domain/ports/mailer-port.ts";
import type { PasswordGeneratorPort } from "../../domain/ports/password-generator-port.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import { TEACHER_EMAIL_UNAVAILABLE } from "../../domain/teachers/teacher.ts";
import { createHmacSchoolSessionSigner } from "../../infrastructure/auth/hmac-school-session.ts";
import { createMemoryTenantStore } from "../tenants/memory-tenant-store.ts";
import { createMemoryStaffStore } from "../staff/memory-staff-store.ts";
import { createMemoryStudentStore } from "../students/memory-student-store.ts";
import { createCreateTeacher } from "./create-teacher.ts";
import { createMemoryTeacherStore } from "./memory-teacher-store.ts";

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
  givenName: "  Abebe  ",
  fatherName: "Bekele",
  grandfatherName: "Tesfaye",
  sex: "male",
  phone: "0912345678",
  email: "  Abebe@North-Hall.et ",
};

async function seedDirector(mailer = testMailer()) {
  const tenants = createMemoryTenantStore();
  const teachers = createMemoryTeacherStore();
  const staffs = createMemoryStaffStore();
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
    teachers,
    staffs,
    students,
    token,
    tenantId: inserted.tenant.id,
    mailer,
    create: createCreateTeacher({
      rootHost: "e-school.et",
      adminEmail: ADMIN_EMAIL,
      publicUrls,
      tenants,
      teachers,
      staffs,
      students,
      hasher,
      mailer,
      passwords,
      sessions,
      now: () => new Date("2026-09-07T12:00:00.000Z"),
    }),
  };
}

describe("createCreateTeacher", () => {
  it("creates a teacher with campus credentials", async () => {
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
    assert.equal(result.teacher.givenName, "Abebe");
    assert.equal(result.teacher.displayName, "Abebe Bekele Tesfaye");
    assert.equal(result.teacher.phone, "+251912345678");
    assert.equal(result.teacher.email, "abebe@north-hall.et");
    assert.equal(result.teacher.employeeId, "AAAT/00001/26");
    assert.equal(result.teacher.mustChangePassword, true);
    assert.equal(result.credentials.password, TEMP_PASSWORD);
    assert.equal(result.credentials.schoolId, "AAAT/00001/26");
    assert.equal(
      result.credentials.loginUrl,
      "http://north-hall.e-school.et:3000/login?email=abebe%40north-hall.et",
    );
    assert.equal(result.emailSent, true);
    assert.equal(mailer.calls.length, 1);
    assert.match(mailer.calls[0]?.text ?? "", /Teacher account/);
    assert.match(mailer.calls[0]?.text ?? "", /AAAT\/00001\/26/);
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

  it("rejects a taken teacher email, the director email, and the admin email", async () => {
    const { create, token } = await seedDirector();
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
      email: "ABEBE@north-hall.et",
    });
    assert.equal(taken.ok, false);
    if (!taken.ok) {
      assert.equal(taken.status, 409);
      assert.equal(taken.error, TEACHER_EMAIL_UNAVAILABLE);
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
      assert.equal(director.error, TEACHER_EMAIL_UNAVAILABLE);
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
      assert.equal(admin.error, TEACHER_EMAIL_UNAVAILABLE);
      assert.doesNotMatch(admin.error, /admin|operator|console/i);
    }
  });

  it("increments teacher ids in the same year and resets the next year", async () => {
    const { tenants, teachers, staffs, students, token, tenantId } = await seedDirector();
    const first = createCreateTeacher({
      rootHost: "e-school.et",
      adminEmail: ADMIN_EMAIL,
      publicUrls,
      tenants,
      teachers,
      staffs,
      students,
      hasher,
      mailer: testMailer(),
      passwords,
      sessions,
      now: () => new Date("2026-09-07T12:00:00.000Z"),
    });
    const one = await first({
      hostHeader: CAMPUS,
      token,
      ...validBody,
    });
    assert.equal(one.ok, true);
    if (one.ok) {
      assert.equal(one.teacher.employeeId, "AAAT/00001/26");
    }
    const two = await first({
      hostHeader: CAMPUS,
      token,
      ...validBody,
      email: "second@north-hall.et",
    });
    assert.equal(two.ok, true);
    if (two.ok) {
      assert.equal(two.teacher.employeeId, "AAAT/00002/26");
    }

    const nextYear = createCreateTeacher({
      rootHost: "e-school.et",
      adminEmail: ADMIN_EMAIL,
      publicUrls,
      tenants,
      teachers,
      staffs,
      students,
      hasher,
      mailer: testMailer(),
      passwords,
      sessions,
      now: () => new Date("2027-03-01T09:00:00.000Z"),
    });
    const three = await nextYear({
      hostHeader: CAMPUS,
      token,
      ...validBody,
      email: "third@north-hall.et",
    });
    assert.equal(three.ok, true);
    if (three.ok) {
      assert.equal(three.teacher.employeeId, "AAAT/00001/27");
    }
    assert.equal(tenantId.length > 0, true);
  });

  it("rejects create before the school abbreviation is set", async () => {
    const tenants = createMemoryTenantStore();
    const teachers = createMemoryTeacherStore();
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
    const token = sessions.issue({
      accountId: inserted.tenant.id,
      email: "head@north-hall.et",
      kind: "director",
    }).token;
    const create = createCreateTeacher({
      rootHost: "e-school.et",
      adminEmail: ADMIN_EMAIL,
      publicUrls,
      tenants,
      teachers,
      staffs: createMemoryStaffStore(),
      students: createMemoryStudentStore(),
      hasher,
      mailer: testMailer(),
      passwords,
      sessions,
    });
    const result = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 409);
      assert.match(result.error, /Settings/);
    }
  });

  it("rejects a campus cookie without kind", async () => {
    const { create, tenantId } = await seedDirector();
    const token = sessions.issue({
      accountId: tenantId,
      email: "head@north-hall.et",
    }).token;
    const result = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 401);
    }
  });

  it("rejects a teacher session on director routes", async () => {
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

  it("rejects the app host and a missing session", async () => {
    const { create, token } = await seedDirector();
    const appHost = await create({
      hostHeader: "app.e-school.et:3000",
      token,
      ...validBody,
    });
    assert.equal(appHost.ok, false);
    if (!appHost.ok) {
      assert.equal(appHost.status, 403);
    }

    const missing = await create({
      hostHeader: CAMPUS,
      token: undefined,
      ...validBody,
    });
    assert.equal(missing.ok, false);
    if (!missing.ok) {
      assert.equal(missing.status, 401);
    }
  });

  it("rejects invalid names, phone, and sex", async () => {
    const { create, token } = await seedDirector();
    const emptyName = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
      givenName: "   ",
    });
    assert.equal(emptyName.ok, false);
    if (!emptyName.ok) {
      assert.equal(emptyName.status, 400);
    }

    const phone = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
      phone: "0111234567",
    });
    assert.equal(phone.ok, false);
    if (!phone.ok) {
      assert.equal(phone.status, 400);
    }

    const sex = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
      sex: "other",
    });
    assert.equal(sex.ok, false);
    if (!sex.ok) {
      assert.equal(sex.status, 400);
    }
  });

  it("rejects a staff email in the same school", async () => {
    const { create, staffs, token } = await seedDirector();
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

    const result = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
      email: "Hana@North-Hall.et",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 409);
      assert.equal(result.error, TEACHER_EMAIL_UNAVAILABLE);
    }
  });
});
