import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { AddressInfo } from "node:net";
import { createEmptyTenantDirectory } from "../../application/public-host/empty-tenant-directory.ts";
import { createResolvePublicHost } from "../../application/public-host/resolve-public-host.ts";
import { createListAdminTenants } from "../../application/tenants/list-admin-tenants.ts";
import { createLookupTenantUsername } from "../../application/tenants/lookup-tenant-username.ts";
import { createMemoryTenantStore } from "../../application/tenants/memory-tenant-store.ts";
import {
  createReactivateTenant,
  createSuspendTenant,
} from "../../application/tenants/set-tenant-status.ts";
import type { Tenant } from "../../domain/tenants/tenant.ts";
import type { LoggerPort } from "../../domain/ports/logger-port.ts";
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

function tenant(index: number, day: string): Tenant {
  const stamp = String(index).padStart(2, "0");
  return {
    id: `11111111-1111-1111-1111-1111111111${stamp}`,
    name: `School ${index}`,
    slug: `school-${index}`,
    email: null,
    status: "active",
    founded: `Founded 202${index % 10}`,
    createdAt: new Date(`2026-09-${day}T10:00:00.000Z`),
    mustChangePassword: false,
    lastMailAt: null,
    lastMailOk: null,
    lastMailError: null,
    signedInAt: null,
    abbreviation: null,
  };
}

const seeded = [tenant(1, "01"), tenant(2, "02"), tenant(3, "03")];

describe("createApp GET /admin/tenants", () => {
  const store = createMemoryTenantStore(seeded);
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
    createTenant: async () => unusedFeatured(),
    listAdminTenants: createListAdminTenants({ rootHost, store }),
    getAdminDashboard: async () => unusedFeatured(),
    lookupTenantUsername: createLookupTenantUsername({ rootHost, store }),
    suspendTenant: createSuspendTenant({ rootHost, store }),
    reactivateTenant: createReactivateTenant({ rootHost, store }),
    resendTenantCredentials: async () => unusedFeatured(),
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
      "x-school-host": "admin.e-school.et:3000",
    };
  }

  it("requires an admin session", async () => {
    const response = await fetch(`${baseUrl}/admin/tenants`, {
      headers: { "x-school-host": "admin.e-school.et:3000" },
    });
    assert.equal(response.status, 401);
  });

  it("rejects a school host", async () => {
    const response = await fetch(`${baseUrl}/admin/tenants`, {
      headers: {
        authorization: "Bearer tok",
        "x-school-host": "school-1.e-school.et",
      },
    });
    assert.equal(response.status, 403);
  });

  it("lists the first page newest first", async () => {
    const response = await fetch(`${baseUrl}/admin/tenants`, {
      headers: adminHeaders(),
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      schools: { slug: string; username: string; host: string }[];
      page: number;
      pageSize: number;
      total: number;
    };
    assert.equal(body.page, 1);
    assert.equal(body.pageSize, 10);
    assert.equal(body.total, 3);
    assert.deepEqual(
      body.schools.map((school) => school.slug),
      ["school-3", "school-2", "school-1"],
    );
    assert.equal(body.schools[0]?.username, "school-3");
    assert.equal(body.schools[0]?.host, "school-3.e-school.et");
  });

  it("serves the second page and clamps page bounds", async () => {
    const pageTwo = await fetch(`${baseUrl}/admin/tenants?page=2&pageSize=2`, {
      headers: adminHeaders(),
    });
    assert.equal(pageTwo.status, 200);
    const second = (await pageTwo.json()) as {
      schools: { slug: string }[];
      page: number;
      pageSize: number;
      total: number;
    };
    assert.equal(second.page, 2);
    assert.equal(second.pageSize, 2);
    assert.equal(second.total, 3);
    assert.deepEqual(
      second.schools.map((school) => school.slug),
      ["school-1"],
    );

    const clamped = await fetch(`${baseUrl}/admin/tenants?page=0&pageSize=100`, {
      headers: adminHeaders(),
    });
    assert.equal(clamped.status, 200);
    const bounds = (await clamped.json()) as { page: number; pageSize: number };
    assert.equal(bounds.page, 1);
    assert.equal(bounds.pageSize, 50);
  });
});

describe("createApp GET /admin/tenants empty list", () => {
  const rootHost = "e-school.et";
  const store = createMemoryTenantStore();
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
    createTenant: async () => unusedFeatured(),
    listAdminTenants: createListAdminTenants({ rootHost, store }),
    getAdminDashboard: async () => unusedFeatured(),
    lookupTenantUsername: createLookupTenantUsername({ rootHost, store }),
    suspendTenant: createSuspendTenant({ rootHost, store }),
    reactivateTenant: createReactivateTenant({ rootHost, store }),
    resendTenantCredentials: async () => unusedFeatured(),
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

  it("returns an empty page", async () => {
    const response = await fetch(`${baseUrl}/admin/tenants`, {
      headers: {
        authorization: "Bearer tok",
        "x-school-host": "admin.e-school.et:3000",
      },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      schools: [],
      page: 1,
      pageSize: 10,
      total: 0,
    });
  });
});
