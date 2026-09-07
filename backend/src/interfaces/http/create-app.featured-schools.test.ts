import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { AddressInfo } from "node:net";
import { createCreateFeaturedSchool } from "../../application/featured-schools/create-featured-school.ts";
import { createDeleteFeaturedSchool } from "../../application/featured-schools/delete-featured-school.ts";
import { createListAdminFeaturedSchools } from "../../application/featured-schools/list-admin-featured-schools.ts";
import { createListPublicFeaturedSchools } from "../../application/featured-schools/list-public-featured-schools.ts";
import { createMemoryFeaturedSchoolStore } from "../../application/featured-schools/memory-featured-school-store.ts";
import { createUpdateFeaturedSchool } from "../../application/featured-schools/update-featured-school.ts";
import { createEmptyTenantDirectory } from "../../application/public-host/empty-tenant-directory.ts";
import { createResolvePublicHost } from "../../application/public-host/resolve-public-host.ts";
import type { FeaturedSchool } from "../../domain/featured-schools/featured-school.ts";
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

function unusedTenant() {
  return {
    ok: false as const,
    status: 403 as const,
    error: "unused",
  };
}

const published: FeaturedSchool = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "North Hall",
  slug: "north-hall",
  createdAt: new Date("2026-09-01T10:00:00.000Z"),
  sortOrder: 0,
  published: true,
};

const draft: FeaturedSchool = {
  id: "22222222-2222-2222-2222-222222222222",
  name: "Draft Campus",
  slug: "draft",
  createdAt: new Date("2026-09-02T10:00:00.000Z"),
  sortOrder: 1,
  published: false,
};

describe("createApp featured schools", () => {
  const store = createMemoryFeaturedSchoolStore([published, draft]);
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
    listPublicFeaturedSchools: createListPublicFeaturedSchools({
      rootHost,
      store,
    }),
    resolvePublicHost: createResolvePublicHost({
      rootHost,
      tenants: createEmptyTenantDirectory(),
    }),
    listAdminFeaturedSchools: createListAdminFeaturedSchools({
      rootHost,
      store,
    }),
    createFeaturedSchool: createCreateFeaturedSchool({ rootHost, store }),
    updateFeaturedSchool: createUpdateFeaturedSchool({ rootHost, store }),
    deleteFeaturedSchool: createDeleteFeaturedSchool({ rootHost, store }),
    createTenant: async () => unusedTenant(),
    listAdminTenants: async () => ({
      ok: true,
      schools: [],
      page: 1,
      pageSize: 10,
      total: 0,
    }),
    getAdminDashboard: async () => unusedTenant(),
    lookupTenantUsername: async () => unusedTenant(),
    suspendTenant: async () => unusedTenant(),
    reactivateTenant: async () => unusedTenant(),
    resendTenantCredentials: async () => unusedTenant(),
    submitContactMessage: async () => ({
      ok: false,
      status: 400,
      error: "unused",
    }),
    listAdminContactMessages: async () => unusedTenant(),
    actOnContactMessage: async () => unusedTenant(),
    signInSchoolAccount: async () => unusedTenant(),
    readSchoolAccountSession: async () => unusedTenant(),
    changeSchoolAccountPassword: async () => unusedTenant(),
    claimSchoolAccountUsername: async () => unusedTenant(),
    lookupSchoolAccountUsername: async () => unusedTenant(),
    readAppAbbreviation: async () => unusedTenant(),
    claimAppAbbreviation: async () => unusedTenant(),
    readSettingsAbbreviation: async () => unusedTenant(),
    claimSettingsAbbreviation: async () => unusedTenant(),
    signInCampusAccount: async () => unusedTenant(),
    readCampusAccountSession: async () => unusedTenant(),
    createTeacher: async () => unusedTenant(),
    listSchoolTeachers: async () => unusedTenant(),
    resendTeacherCredentials: async () => unusedTenant(),
    changeTeacherPassword: async () => unusedTenant(),
    createStaff: async () => unusedTenant(),
    listSchoolStaff: async () => unusedTenant(),
    resendStaffCredentials: async () => unusedTenant(),
    changeStaffPassword: async () => unusedTenant(),
    createStudent: async () => unusedTenant(),
    listSchoolStudents: async () => unusedTenant(),
    resendStudentCredentials: async () => unusedTenant(),
    changeStudentPassword: async () => unusedTenant(),
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

  it("lists published schools for guests", async () => {
    const response = await fetch(`${baseUrl}/public/featured-schools`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      schools: [
        {
          id: published.id,
          name: "North Hall",
          slug: "north-hall",
          created: "2026-09-01T10:00:00.000Z",
          host: "north-hall.e-school.et",
        },
      ],
    });
  });

  it("requires an admin session", async () => {
    const response = await fetch(`${baseUrl}/admin/featured-schools`, {
      headers: { "x-school-host": "admin.e-school.et" },
    });
    assert.equal(response.status, 401);
  });

  it("rejects school hosts on admin routes", async () => {
    const response = await fetch(`${baseUrl}/admin/featured-schools`, {
      headers: {
        authorization: "Bearer tok",
        "x-school-host": "north-hall.e-school.et",
      },
    });
    assert.equal(response.status, 403);
  });

  it("lists every row from the admin host with a session", async () => {
    const response = await fetch(`${baseUrl}/admin/featured-schools`, {
      headers: {
        authorization: "Bearer tok",
        "x-school-host": "admin.e-school.et:3000",
      },
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as { schools: { slug: string }[] };
    assert.deepEqual(
      body.schools.map((school) => school.slug),
      ["north-hall", "draft"],
    );
  });
});
