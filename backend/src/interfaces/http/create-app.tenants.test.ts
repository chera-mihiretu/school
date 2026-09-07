import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { AddressInfo } from "node:net";
import { createEmptyTenantDirectory } from "../../application/public-host/empty-tenant-directory.ts";
import { createResolvePublicHost } from "../../application/public-host/resolve-public-host.ts";
import { createCreateTenant } from "../../application/tenants/create-tenant.ts";
import { createListAdminTenants } from "../../application/tenants/list-admin-tenants.ts";
import { createLookupTenantUsername } from "../../application/tenants/lookup-tenant-username.ts";
import { createMemoryTenantStore } from "../../application/tenants/memory-tenant-store.ts";
import { createResendTenantCredentials } from "../../application/tenants/resend-tenant-credentials.ts";
import {
  createReactivateTenant,
  createSuspendTenant,
} from "../../application/tenants/set-tenant-status.ts";
import type { LoggerPort } from "../../domain/ports/logger-port.ts";
import type { MailerPort, MailerSendInput } from "../../domain/ports/mailer-port.ts";
import type { PasswordGeneratorPort } from "../../domain/ports/password-generator-port.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { PublicUrlPort } from "../../domain/ports/public-url-port.ts";
import { TENANT_EMAIL_UNAVAILABLE } from "../../domain/tenants/tenant.ts";
import { createApp } from "./create-app.ts";

const silentLogger: LoggerPort = {
  debug() {},
  info() {},
  warn() {},
  error() {},
  fatal() {},
  flush() {},
};

function unusedFeatured() {
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

describe("createApp POST /admin/tenants", () => {
  const store = createMemoryTenantStore();
  const rootHost = "e-school.et";
  const server = createApp({
    logger: silentLogger,
    getHealth: async () => ({
      ok: true,
      service: "backend-service",
      database: "up",
    }),
    signInPlatformAdmin: async () => ({
      ok: false,
      status: 401,
      error: "unused",
    }),
    readPlatformAdminSession: (token) =>
      token === "tok"
        ? { email: "admin@e-school.et", expiresAt: "2026-09-06T12:00:00.000Z" }
        : undefined,
    listPublicFeaturedSchools: async () => ({ schools: [] }),
    resolvePublicHost: createResolvePublicHost({
      rootHost,
      tenants: createEmptyTenantDirectory(),
    }),
    listAdminFeaturedSchools: async () => unusedFeatured(),
    createFeaturedSchool: async () => unusedFeatured(),
    updateFeaturedSchool: async () => unusedFeatured(),
    deleteFeaturedSchool: async () => unusedFeatured(),
    createTenant: createCreateTenant({
      rootHost,
      adminEmail: "admin@e-school.et",
      publicUrls,
      store,
      hasher,
      mailer,
      passwords,
    }),
    listAdminTenants: createListAdminTenants({ rootHost, store }),
    getAdminDashboard: async () => unusedFeatured(),
    lookupTenantUsername: createLookupTenantUsername({ rootHost, store }),
    suspendTenant: createSuspendTenant({ rootHost, store }),
    reactivateTenant: createReactivateTenant({ rootHost, store }),
    resendTenantCredentials: createResendTenantCredentials({
      rootHost,
      publicUrls,
      store,
      hasher,
      mailer,
      passwords,
    }),
    submitContactMessage: async () => ({
      ok: false,
      status: 400,
      error: "unused",
    }),
    listAdminContactMessages: async () => unusedFeatured(),
    actOnContactMessage: async () => unusedFeatured(),
    signInSchoolAccount: async () => unusedFeatured(),
    readSchoolAccountSession: async () => unusedFeatured(),
    changeSchoolAccountPassword: async () => unusedFeatured(),
    claimSchoolAccountUsername: async () => unusedFeatured(),
    lookupSchoolAccountUsername: async () => unusedFeatured(),
    readAppAbbreviation: async () => unusedFeatured(),
    claimAppAbbreviation: async () => unusedFeatured(),
    readSettingsAbbreviation: async () => unusedFeatured(),
    claimSettingsAbbreviation: async () => unusedFeatured(),
    signInCampusAccount: async () => unusedFeatured(),
    readCampusAccountSession: async () => unusedFeatured(),
    createTeacher: async () => unusedFeatured(),
    listSchoolTeachers: async () => unusedFeatured(),
    resendTeacherCredentials: async () => unusedFeatured(),
    changeTeacherPassword: async () => unusedFeatured(),
    createStaff: async () => unusedFeatured(),
    listSchoolStaff: async () => unusedFeatured(),
    resendStaffCredentials: async () => unusedFeatured(),
    changeStaffPassword: async () => unusedFeatured(),
    createStudent: async () => unusedFeatured(),
    listSchoolStudents: async () => unusedFeatured(),
    resendStudentCredentials: async () => unusedFeatured(),
    changeStudentPassword: async () => unusedFeatured(),
  });

  let baseUrl = "";

  before(async () => {
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

  function adminHeaders(): Record<string, string> {
    return {
      authorization: "Bearer tok",
      "content-type": "application/json",
      "x-school-host": "admin.e-school.et:3000",
    };
  }

  it("creates a pending tenant on the admin host", async () => {
    const response = await fetch(`${baseUrl}/admin/tenants`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ name: "North Hall", email: "head@north-hall.et" }),
    });

    assert.equal(response.status, 201);
    const body = (await response.json()) as {
      school: {
        slug: string | null;
        username: string | null;
        email: string;
        status: string;
        host: string | null;
        mustChangePassword: boolean;
      };
      credentials: { email: string; password: string; firstLoginUrl: string };
      emailSent: boolean;
    };
    assert.equal(body.school.slug, null);
    assert.equal(body.school.username, null);
    assert.equal(body.school.email, "head@north-hall.et");
    assert.equal(body.school.status, "pending_setup");
    assert.equal(body.school.host, null);
    assert.equal(body.school.mustChangePassword, true);
    assert.equal(body.credentials.email, "head@north-hall.et");
    assert.equal(body.credentials.password, "temp-password-16x");
    assert.equal(
      body.credentials.firstLoginUrl,
      "http://app.e-school.et:3000/first-login?email=head%40north-hall.et",
    );
    assert.equal(body.emailSent, true);
  });

  it("rejects a missing email", async () => {
    const response = await fetch(`${baseUrl}/admin/tenants`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ name: "Admin Campus" }),
    });
    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: string };
    assert.match(body.error, /email/i);
  });

  it("rejects a duplicate email", async () => {
    const sentBefore = mailerCalls.length;
    const response = await fetch(`${baseUrl}/admin/tenants`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ name: "North Hall Two", email: "Head@North-Hall.et" }),
    });
    assert.equal(response.status, 409);
    const body = (await response.json()) as { error: string };
    assert.equal(body.error, TENANT_EMAIL_UNAVAILABLE);
    assert.equal(mailerCalls.length, sentBefore);
  });

  it("rejects the platform admin email without sending mail", async () => {
    const sentBefore = mailerCalls.length;
    const response = await fetch(`${baseUrl}/admin/tenants`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        name: "Admin Campus",
        email: "  Admin@E-School.et ",
      }),
    });
    assert.equal(response.status, 409);
    const body = (await response.json()) as { error: string };
    assert.equal(body.error, TENANT_EMAIL_UNAVAILABLE);
    assert.doesNotMatch(body.error, /admin|operator|console/i);
    assert.equal(mailerCalls.length, sentBefore);
  });

  it("lists a created tenant on the first page", async () => {
    const response = await fetch(`${baseUrl}/admin/tenants`, {
      headers: {
        authorization: "Bearer tok",
        "x-school-host": "admin.e-school.et:3000",
      },
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      schools: { email: string | null; slug: string | null; status: string }[];
      total: number;
    };
    assert.ok(body.total >= 1);
    const created = body.schools.find(
      (school) => school.email === "head@north-hall.et",
    );
    assert.ok(created);
    assert.equal(created.slug, null);
    assert.equal(created.status, "pending_setup");
  });

  it("suspends and reactivates a created tenant", async () => {
    const listed = await fetch(`${baseUrl}/admin/tenants`, {
      headers: {
        authorization: "Bearer tok",
        "x-school-host": "admin.e-school.et:3000",
      },
    });
    const page = (await listed.json()) as {
      schools: { id: string; email: string | null }[];
    };
    const created = page.schools.find(
      (school) => school.email === "head@north-hall.et",
    );
    assert.ok(created);

    const suspended = await fetch(
      `${baseUrl}/admin/tenants/${created.id}/suspend`,
      {
        method: "POST",
        headers: {
          authorization: "Bearer tok",
          "x-school-host": "admin.e-school.et:3000",
        },
      },
    );
    assert.equal(suspended.status, 200);
    const suspendedBody = (await suspended.json()) as {
      school: { status: string };
    };
    assert.equal(suspendedBody.school.status, "suspended");

    const reactivated = await fetch(
      `${baseUrl}/admin/tenants/${created.id}/reactivate`,
      {
        method: "POST",
        headers: {
          authorization: "Bearer tok",
          "x-school-host": "admin.e-school.et:3000",
        },
      },
    );
    assert.equal(reactivated.status, 200);
    const reactivatedBody = (await reactivated.json()) as {
      school: { status: string };
    };
    assert.equal(reactivatedBody.school.status, "active");
  });

  it("rejects a non-admin host", async () => {
    const response = await fetch(`${baseUrl}/admin/tenants`, {
      method: "POST",
      headers: {
        authorization: "Bearer tok",
        "content-type": "application/json",
        "x-school-host": "demo.e-school.et:3000",
      },
      body: JSON.stringify({ name: "Demo", email: "head@demo.et" }),
    });
    assert.equal(response.status, 403);
  });

  it("looks up a live username on the admin host", async () => {
    const free = await fetch(
      `${baseUrl}/admin/tenants/username?slug=west-quay`,
      {
        headers: {
          authorization: "Bearer tok",
          "x-school-host": "admin.e-school.et:3000",
        },
      },
    );
    assert.equal(free.status, 200);
    assert.deepEqual(await free.json(), {
      username: "west-quay",
      available: true,
    });

    const inserted = await store.insert({
      name: "West Quay",
      slug: "west-quay",
      founded: "Founded 2026",
    });
    assert.equal(inserted.ok, true);

    const taken = await fetch(
      `${baseUrl}/admin/tenants/username?slug=west-quay`,
      {
        headers: {
          authorization: "Bearer tok",
          "x-school-host": "admin.e-school.et:3000",
        },
      },
    );
    assert.equal(taken.status, 200);
    assert.deepEqual(await taken.json(), {
      username: "west-quay",
      available: false,
      reason: "taken",
    });

    const reserved = await fetch(`${baseUrl}/admin/tenants/username?slug=admin`, {
      headers: {
        authorization: "Bearer tok",
        "x-school-host": "admin.e-school.et:3000",
      },
    });
    assert.equal(reserved.status, 200);
    assert.deepEqual(await reserved.json(), {
      username: "admin",
      available: false,
      reason: "reserved",
    });
  });

  it("requires an admin session to look up a username", async () => {
    const response = await fetch(
      `${baseUrl}/admin/tenants/username?slug=east-yard`,
      {
        headers: { "x-school-host": "admin.e-school.et:3000" },
      },
    );
    assert.equal(response.status, 401);
  });

  it("resends credentials on the admin host", async () => {
    const created = await fetch(`${baseUrl}/admin/tenants`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        name: "Resend Hall",
        email: "head@resend-hall.et",
      }),
    });
    assert.equal(created.status, 201);
    const createdBody = (await created.json()) as { school: { id: string } };

    const unauthorized = await fetch(
      `${baseUrl}/admin/tenants/${createdBody.school.id}/resend-credentials`,
      {
        method: "POST",
        headers: { "x-school-host": "admin.e-school.et:3000" },
      },
    );
    assert.equal(unauthorized.status, 401);

    const resent = await fetch(
      `${baseUrl}/admin/tenants/${createdBody.school.id}/resend-credentials`,
      {
        method: "POST",
        headers: {
          authorization: "Bearer tok",
          "x-school-host": "admin.e-school.et:3000",
        },
      },
    );
    assert.equal(resent.status, 200);
    const body = (await resent.json()) as {
      school: { email: string; lastMailOk: boolean | null };
      credentials: { email: string; password: string; firstLoginUrl: string };
      emailSent: boolean;
    };
    assert.equal(body.school.email, "head@resend-hall.et");
    assert.equal(body.credentials.email, "head@resend-hall.et");
    assert.equal(body.credentials.password, "temp-password-16x");
    assert.equal(
      body.credentials.firstLoginUrl,
      "http://app.e-school.et:3000/first-login?email=head%40resend-hall.et",
    );
    assert.equal(body.emailSent, true);
    assert.equal(body.school.lastMailOk, true);
  });

  it("rejects resend after the username is claimed", async () => {
    const created = await fetch(`${baseUrl}/admin/tenants`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        name: "Claimed Hall",
        email: "head@claimed-hall.et",
      }),
    });
    assert.equal(created.status, 201);
    const createdBody = (await created.json()) as { school: { id: string } };
    const claimed = await store.claimSlug({
      id: createdBody.school.id,
      slug: "claimed-hall",
    });
    assert.equal(claimed.ok, true);

    const response = await fetch(
      `${baseUrl}/admin/tenants/${createdBody.school.id}/resend-credentials`,
      {
        method: "POST",
        headers: {
          authorization: "Bearer tok",
          "x-school-host": "admin.e-school.et:3000",
        },
      },
    );
    assert.equal(response.status, 409);
  });
});
