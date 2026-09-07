import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MailerPort, MailerSendInput } from "../../domain/ports/mailer-port.ts";
import type { PasswordGeneratorPort } from "../../domain/ports/password-generator-port.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import { STUDENT_EMAIL_UNAVAILABLE } from "../../domain/students/student.ts";
import { createHmacSchoolSessionSigner } from "../../infrastructure/auth/hmac-school-session.ts";
import { createMemoryStaffStore } from "../staff/memory-staff-store.ts";
import { createMemoryTeacherStore } from "../teachers/memory-teacher-store.ts";
import { createMemoryTenantStore } from "../tenants/memory-tenant-store.ts";
import { createCreateStudent } from "./create-student.ts";
import { createMemoryStudentStore } from "./memory-student-store.ts";

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
  givenName: "  Lidya  ",
  fatherName: "Bekele",
  grandfatherName: "Tessema",
  sex: "female",
  phone: "",
  email: "  Lidya@North-Hall.et ",
};

async function seedOffice(kind: "director" | "staff" = "director") {
  const tenants = createMemoryTenantStore();
  const students = createMemoryStudentStore();
  const staffs = createMemoryStaffStore();
  const teachers = createMemoryTeacherStore();
  const mailer = testMailer();
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
  assert.equal(staff.ok, true);
  if (!staff.ok) {
    throw new Error("staff seed failed");
  }

  const token = sessions.issue({
    accountId: kind === "director" ? inserted.tenant.id : staff.staff.id,
    email: kind === "director" ? "head@north-hall.et" : "hana@north-hall.et",
    kind,
  }).token;

  return {
    token,
    mailer,
    create: createCreateStudent({
      rootHost: "e-school.et",
      adminEmail: ADMIN_EMAIL,
      publicUrls,
      tenants,
      students,
      staffs,
      teachers,
      hasher,
      mailer,
      passwords,
      sessions,
      now: () => new Date("2026-09-07T12:00:00.000Z"),
    }),
  };
}

describe("createCreateStudent", () => {
  it("creates a student with optional phone from a director session", async () => {
    const { create, mailer, token } = await seedOffice("director");
    const result = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.student.givenName, "Lidya");
    assert.equal(result.student.phone, null);
    assert.equal(result.student.employeeId, "AAAS/00001/26");
    assert.equal(result.emailSent, true);
    assert.match(mailer.calls[0]?.text ?? "", /Student account/);
    assert.match(mailer.calls[0]?.html ?? "", /#f2ece0/);
  });

  it("lets staff create a student with a phone number", async () => {
    const { create, token } = await seedOffice("staff");
    const result = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
      phone: "0911223344",
      email: "kidist@north-hall.et",
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.student.phone, "+251911223344");
    assert.equal(result.student.employeeId, "AAAS/00001/26");
  });

  it("rejects a taken student, staff, teacher, director, or admin email", async () => {
    const { create, token } = await seedOffice();
    const first = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
    });
    assert.equal(first.ok, true);
    const again = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
      email: "lidya@north-hall.et",
    });
    assert.equal(again.ok, false);
    if (!again.ok) {
      assert.equal(again.status, 409);
      assert.equal(again.error, STUDENT_EMAIL_UNAVAILABLE);
    }
    const staffEmail = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
      email: "hana@north-hall.et",
    });
    assert.equal(staffEmail.ok, false);
    const directorEmail = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
      email: "head@north-hall.et",
    });
    assert.equal(directorEmail.ok, false);
    const admin = await create({
      hostHeader: CAMPUS,
      token,
      ...validBody,
      email: ADMIN_EMAIL,
    });
    assert.equal(admin.ok, false);
  });
});
