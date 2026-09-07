import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { AddressInfo } from "node:net";
import { createReadCampusAccountSession } from "../../application/school-accounts/read-campus-session.ts";
import { createSignInCampusAccount } from "../../application/school-accounts/sign-in-campus.ts";
import { createEmptyTenantDirectory } from "../../application/public-host/empty-tenant-directory.ts";
import { createResolvePublicHost } from "../../application/public-host/resolve-public-host.ts";
import { createChangeTeacherPassword } from "../../application/teachers/change-teacher-password.ts";
import { createCreateTeacher } from "../../application/teachers/create-teacher.ts";
import { createListSchoolTeachers } from "../../application/teachers/list-teachers.ts";
import { createMemoryStaffStore } from "../../application/staff/memory-staff-store.ts";
import { createMemoryStudentStore } from "../../application/students/memory-student-store.ts";
import { createMemoryTeacherStore } from "../../application/teachers/memory-teacher-store.ts";
import { createResendTeacherCredentials } from "../../application/teachers/resend-teacher-credentials.ts";
import { createMemoryTenantStore } from "../../application/tenants/memory-tenant-store.ts";
import type { LoggerPort } from "../../domain/ports/logger-port.ts";
import type { MailerPort, MailerSendInput } from "../../domain/ports/mailer-port.ts";
import type { PasswordGeneratorPort } from "../../domain/ports/password-generator-port.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import { TEACHER_EMAIL_UNAVAILABLE } from "../../domain/teachers/teacher.ts";
import { createHmacSessionSigner } from "../../infrastructure/auth/hmac-session.ts";
import { createHmacSchoolSessionSigner } from "../../infrastructure/auth/hmac-school-session.ts";
import { createApp } from "./create-app.ts";

const silentLogger: LoggerPort = {
  debug() {},
  info() {},
  warn() {},
  error() {},
  fatal() {},
  flush() {},
};

function unusedAdmin() {
  return {
    ok: false as const,
    status: 403 as const,
    error: "unused",
  };
}

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
    return "temp-password-16x";
  },
};

const mailerCalls: MailerSendInput[] = [];
const mailer: MailerPort = {
  async send(input) {
    mailerCalls.push(input);
    return { ok: true };
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

const secret = "a-very-long-session-secret-value";
const rootHost = "e-school.et";
const campusHost = "north-hall.e-school.et:3000";

describe("createApp /school-teachers", () => {
  const store = createMemoryTenantStore();
  const teachers = createMemoryTeacherStore();
  const staffs = createMemoryStaffStore();
  const students = createMemoryStudentStore();
  const sessions = createHmacSchoolSessionSigner({
    secret,
    ttlSeconds: 3600,
    now: () => new Date("2026-09-07T12:00:00.000Z"),
  });
  const server = createApp({
    logger: silentLogger,
    getHealth: async () => ({
      ok: true,
      service: "backend-service",
      database: "up",
    }),
    signInPlatformAdmin: async () => unusedAdmin(),
    readPlatformAdminSession: () => undefined,
    listPublicFeaturedSchools: async () => ({ schools: [] }),
    resolvePublicHost: createResolvePublicHost({
      rootHost,
      tenants: createEmptyTenantDirectory(),
    }),
    listAdminFeaturedSchools: async () => unusedAdmin(),
    createFeaturedSchool: async () => unusedAdmin(),
    updateFeaturedSchool: async () => unusedAdmin(),
    deleteFeaturedSchool: async () => unusedAdmin(),
    createTenant: async () => unusedAdmin(),
    listAdminTenants: async () => ({
      ok: true,
      schools: [],
      page: 1,
      pageSize: 10,
      total: 0,
    }),
    getAdminDashboard: async () => unusedAdmin(),
    lookupTenantUsername: async () => unusedAdmin(),
    suspendTenant: async () => unusedAdmin(),
    reactivateTenant: async () => unusedAdmin(),
    resendTenantCredentials: async () => unusedAdmin(),
    submitContactMessage: async () => ({
      ok: false,
      status: 400,
      error: "unused",
    }),
    listAdminContactMessages: async () => unusedAdmin(),
    actOnContactMessage: async () => unusedAdmin(),
    signInSchoolAccount: async () => unusedAdmin(),
    readSchoolAccountSession: async () => unusedAdmin(),
    changeSchoolAccountPassword: async () => unusedAdmin(),
    claimSchoolAccountUsername: async () => unusedAdmin(),
    lookupSchoolAccountUsername: async () => unusedAdmin(),
    readAppAbbreviation: async () => unusedAdmin(),
    claimAppAbbreviation: async () => unusedAdmin(),
    readSettingsAbbreviation: async () => unusedAdmin(),
    claimSettingsAbbreviation: async () => unusedAdmin(),
    signInCampusAccount: createSignInCampusAccount({
      rootHost,
      store,
      teachers,
      staffs,
      students,
      hasher,
      sessions,
    }),
    readCampusAccountSession: createReadCampusAccountSession({
      rootHost,
      store,
      teachers,
      staffs,
      students,
      sessions,
    }),
    createTeacher: createCreateTeacher({
      rootHost,
      adminEmail: "admin@e-school.et",
      publicUrls,
      tenants: store,
      teachers,
      staffs,
      students,
      hasher,
      mailer,
      passwords,
      sessions,
    }),
    listSchoolTeachers: createListSchoolTeachers({
      rootHost,
      tenants: store,
      teachers,
      sessions,
    }),
    resendTeacherCredentials: createResendTeacherCredentials({
      rootHost,
      publicUrls,
      tenants: store,
      teachers,
      hasher,
      mailer,
      passwords,
      sessions,
    }),
    changeTeacherPassword: createChangeTeacherPassword({
      rootHost,
      tenants: store,
      teachers,
      hasher,
      sessions,
    }),
    createStaff: async () => unusedAdmin(),
    listSchoolStaff: async () => unusedAdmin(),
    resendStaffCredentials: async () => unusedAdmin(),
    changeStaffPassword: async () => unusedAdmin(),
    createStudent: async () => unusedAdmin(),
    listSchoolStudents: async () => unusedAdmin(),
    resendStudentCredentials: async () => unusedAdmin(),
    changeStudentPassword: async () => unusedAdmin(),
  });

  let baseUrl = "";
  let directorToken = "";
  let directorAccountId = "";

  before(async () => {
    const pending = await store.insertPending({
      name: "North Hall",
      email: "head@north-hall.et",
      passwordHash: "hash:a-kept-password",
      founded: "Founded 2026",
    });
    assert.equal(pending.ok, true);
    if (!pending.ok) {
      throw new Error("insert failed");
    }
    directorAccountId = pending.tenant.id;
    await store.updatePassword({
      id: pending.tenant.id,
      passwordHash: "hash:a-kept-password",
      mustChangePassword: false,
    });
    await store.claimSlug({ id: pending.tenant.id, slug: "north-hall" });
    const abbreviated = await store.claimAbbreviation({
      id: pending.tenant.id,
      abbreviation: "AAA",
    });
    assert.equal(abbreviated.ok, true);
    directorToken = sessions.issue({
      accountId: pending.tenant.id,
      email: "head@north-hall.et",
      kind: "director",
    }).token;

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });

  function campusHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      "content-type": "application/json",
      "x-school-host": campusHost,
      authorization: `Bearer ${directorToken}`,
      ...extra,
    };
  }

  const teacherBody = {
    givenName: "Abebe",
    fatherName: "Bekele",
    grandfatherName: "Tesfaye",
    sex: "male",
    phone: "0912345678",
    email: "abebe@north-hall.et",
  };

  it("creates a teacher on the campus host", async () => {
    const response = await fetch(`${baseUrl}/school-teachers`, {
      method: "POST",
      headers: campusHeaders(),
      body: JSON.stringify(teacherBody),
    });
    assert.equal(response.status, 201);
    const body = (await response.json()) as {
      teacher: { displayName: string; phone: string; email: string; employeeId: string };
      credentials: { password: string; loginUrl: string; schoolId: string };
      emailSent: boolean;
    };
    assert.equal(body.teacher.displayName, "Abebe Bekele Tesfaye");
    assert.equal(body.teacher.phone, "+251912345678");
    assert.equal(body.teacher.email, "abebe@north-hall.et");
    assert.equal(body.teacher.employeeId, "AAAT/00001/26");
    assert.equal(body.credentials.password, "temp-password-16x");
    assert.equal(body.credentials.schoolId, "AAAT/00001/26");
    assert.equal(
      body.credentials.loginUrl,
      "http://north-hall.e-school.et:3000/login?email=abebe%40north-hall.et",
    );
    assert.equal(body.emailSent, true);
  });

  it("lists teachers newest first", async () => {
    const second = await fetch(`${baseUrl}/school-teachers`, {
      method: "POST",
      headers: campusHeaders(),
      body: JSON.stringify({
        ...teacherBody,
        givenName: "Almaz",
        email: "almaz@north-hall.et",
        sex: "female",
        phone: "0712345678",
      }),
    });
    assert.equal(second.status, 201);

    const response = await fetch(`${baseUrl}/school-teachers`, {
      headers: campusHeaders(),
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as { teachers: { email: string }[] };
    assert.deepEqual(
      body.teachers.map((teacher) => teacher.email),
      ["almaz@north-hall.et", "abebe@north-hall.et"],
    );
  });

  it("rejects a duplicate email with the generic copy", async () => {
    const response = await fetch(`${baseUrl}/school-teachers`, {
      method: "POST",
      headers: campusHeaders(),
      body: JSON.stringify(teacherBody),
    });
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: TEACHER_EMAIL_UNAVAILABLE });
  });

  it("rejects the director email and platform admin email", async () => {
    for (const email of ["head@north-hall.et", "admin@e-school.et"]) {
      const response = await fetch(`${baseUrl}/school-teachers`, {
        method: "POST",
        headers: campusHeaders(),
        body: JSON.stringify({ ...teacherBody, email }),
      });
      assert.equal(response.status, 409);
      assert.deepEqual(await response.json(), { error: TEACHER_EMAIL_UNAVAILABLE });
    }
  });

  it("rejects GET list with only the campus host", async () => {
    const response = await fetch(`${baseUrl}/school-teachers`, {
      headers: { "x-school-host": campusHost },
    });
    assert.equal(response.status, 401);
  });

  it("rejects GET list for a teacher session", async () => {
    const teacherToken = sessions.issue({
      accountId: "22222222-2222-2222-2222-222222222222",
      email: "abebe@north-hall.et",
      kind: "teacher",
    }).token;
    const response = await fetch(`${baseUrl}/school-teachers`, {
      headers: campusHeaders({ authorization: `Bearer ${teacherToken}` }),
    });
    assert.equal(response.status, 403);
  });

  it("rejects a campus token that has no kind", async () => {
    const kindless = sessions.issue({
      accountId: directorAccountId,
      email: "head@north-hall.et",
    }).token;
    const listed = await fetch(`${baseUrl}/school-teachers`, {
      headers: campusHeaders({ authorization: `Bearer ${kindless}` }),
    });
    assert.equal(listed.status, 401);

    const created = await fetch(`${baseUrl}/school-teachers`, {
      method: "POST",
      headers: campusHeaders({ authorization: `Bearer ${kindless}` }),
      body: JSON.stringify({ ...teacherBody, email: "kindless@north-hall.et" }),
    });
    assert.equal(created.status, 401);
  });

  it("rejects campus session GET without a token", async () => {
    const response = await fetch(`${baseUrl}/school-accounts/campus-session`, {
      headers: { "x-school-host": campusHost },
    });
    assert.equal(response.status, 401);
  });

  it("rejects the app host and a missing session", async () => {
    const appHost = await fetch(`${baseUrl}/school-teachers`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-school-host": "app.e-school.et:3000",
        authorization: `Bearer ${directorToken}`,
      },
      body: JSON.stringify(teacherBody),
    });
    assert.equal(appHost.status, 403);

    const missing = await fetch(`${baseUrl}/school-teachers`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-school-host": campusHost,
      },
      body: JSON.stringify(teacherBody),
    });
    assert.equal(missing.status, 401);
  });

  it("rejects a platform admin session token", async () => {
    const admin = createHmacSessionSigner({
      secret,
      ttlSeconds: 3600,
      now: () => new Date("2026-09-07T12:00:00.000Z"),
    });
    const issued = admin.issue("admin@e-school.et");
    const response = await fetch(`${baseUrl}/school-teachers`, {
      method: "POST",
      headers: campusHeaders({ authorization: `Bearer ${issued.token}` }),
      body: JSON.stringify({ ...teacherBody, email: "other@north-hall.et" }),
    });
    assert.equal(response.status, 401);
  });

  it("lets a teacher sign in on campus with a school ID", async () => {
    const campus = await fetch(`${baseUrl}/school-accounts/campus-session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-school-host": campusHost,
      },
      body: JSON.stringify({
        identifier: " aaat / 00001 / 26 ",
        password: "temp-password-16x",
      }),
    });
    assert.equal(campus.status, 200);
    const session = (await campus.json()) as {
      kind: string;
      email: string;
      mustChangePassword: boolean;
    };
    assert.equal(session.kind, "teacher");
    assert.equal(session.email, "abebe@north-hall.et");
    assert.equal(session.mustChangePassword, true);

    const student = await fetch(`${baseUrl}/school-accounts/campus-session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-school-host": campusHost,
      },
      body: JSON.stringify({
        identifier: "AAAS/00001/26",
        password: "temp-password-16x",
      }),
    });
    assert.equal(student.status, 401);
  });

  it("lets a teacher sign in on campus and change the password", async () => {
    const campus = await fetch(`${baseUrl}/school-accounts/campus-session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-school-host": campusHost,
      },
      body: JSON.stringify({
        email: "abebe@north-hall.et",
        password: "temp-password-16x",
      }),
    });
    assert.equal(campus.status, 200);
    const session = (await campus.json()) as {
      token: string;
      kind: string;
      mustChangePassword: boolean;
    };
    assert.equal(session.kind, "teacher");
    assert.equal(session.mustChangePassword, true);

    const asTeacher = await fetch(`${baseUrl}/school-teachers`, {
      method: "POST",
      headers: campusHeaders({ authorization: `Bearer ${session.token}` }),
      body: JSON.stringify({ ...teacherBody, email: "new@north-hall.et" }),
    });
    assert.equal(asTeacher.status, 403);

    const changed = await fetch(`${baseUrl}/school-teachers/password`, {
      method: "POST",
      headers: campusHeaders({ authorization: `Bearer ${session.token}` }),
      body: JSON.stringify({ password: "a-kept-password" }),
    });
    assert.equal(changed.status, 200);
    const body = (await changed.json()) as {
      teacher: { mustChangePassword: boolean };
    };
    assert.equal(body.teacher.mustChangePassword, false);

    const again = await fetch(`${baseUrl}/school-teachers/password`, {
      method: "POST",
      headers: campusHeaders({ authorization: `Bearer ${session.token}` }),
      body: JSON.stringify({ password: "another-kept-1" }),
    });
    assert.equal(again.status, 409);
  });

  it("resends credentials only while mustChangePassword is true", async () => {
    const created = await fetch(`${baseUrl}/school-teachers`, {
      method: "POST",
      headers: campusHeaders(),
      body: JSON.stringify({
        ...teacherBody,
        email: "resend@north-hall.et",
      }),
    });
    assert.equal(created.status, 201);
    const createdBody = (await created.json()) as { teacher: { id: string } };

    const resent = await fetch(
      `${baseUrl}/school-teachers/${createdBody.teacher.id}/resend-credentials`,
      {
        method: "POST",
        headers: campusHeaders(),
      },
    );
    assert.equal(resent.status, 200);
    const resentBody = (await resent.json()) as {
      credentials: { password: string };
    };
    assert.equal(resentBody.credentials.password, "temp-password-16x");

    const signedIn = await fetch(`${baseUrl}/school-accounts/campus-session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-school-host": campusHost,
      },
      body: JSON.stringify({
        email: "resend@north-hall.et",
        password: "temp-password-16x",
      }),
    });
    const session = (await signedIn.json()) as { token: string };
    await fetch(`${baseUrl}/school-teachers/password`, {
      method: "POST",
      headers: campusHeaders({ authorization: `Bearer ${session.token}` }),
      body: JSON.stringify({ password: "a-kept-password" }),
    });

    const locked = await fetch(
      `${baseUrl}/school-teachers/${createdBody.teacher.id}/resend-credentials`,
      {
        method: "POST",
        headers: campusHeaders(),
      },
    );
    assert.equal(locked.status, 409);
  });

  it("does not let a director change a teacher password", async () => {
    const response = await fetch(`${baseUrl}/school-teachers/password`, {
      method: "POST",
      headers: campusHeaders(),
      body: JSON.stringify({ password: "a-kept-password" }),
    });
    assert.equal(response.status, 403);
  });
});
