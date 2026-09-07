import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { AddressInfo } from "node:net";
import { createGetAdminDashboard } from "../../application/tenants/get-admin-dashboard.ts";
import { createMemoryTenantStore } from "../../application/tenants/memory-tenant-store.ts";
import { createEmptyTenantDirectory } from "../../application/public-host/empty-tenant-directory.ts";
import { createResolvePublicHost } from "../../application/public-host/resolve-public-host.ts";
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

function unused() {
  return {
    ok: false as const,
    status: 403 as const,
    error: "unused",
  };
}

describe("createApp GET /admin/dashboard", () => {
  const store = createMemoryTenantStore();
  const rootHost = "e-school.et";
  const server = createApp({
    logger: silentLogger,
    getHealth: async () => ({
      ok: true,
      service: "backend-service",
      database: "up",
    }),
    signInPlatformAdmin: async () => unused(),
    readPlatformAdminSession: (token) =>
      token === "tok"
        ? { email: "admin@e-school.et", expiresAt: "2026-09-07T12:00:00.000Z" }
        : undefined,
    listPublicFeaturedSchools: async () => ({ schools: [] }),
    resolvePublicHost: createResolvePublicHost({
      rootHost,
      tenants: createEmptyTenantDirectory(),
    }),
    listAdminFeaturedSchools: async () => unused(),
    createFeaturedSchool: async () => unused(),
    updateFeaturedSchool: async () => unused(),
    deleteFeaturedSchool: async () => unused(),
    createTenant: async () => unused(),
    listAdminTenants: async () => ({
      ok: true,
      schools: [],
      page: 1,
      pageSize: 10,
      total: 0,
    }),
    getAdminDashboard: createGetAdminDashboard({ rootHost, store }),
    lookupTenantUsername: async () => unused(),
    suspendTenant: async () => unused(),
    reactivateTenant: async () => unused(),
    resendTenantCredentials: async () => unused(),
    submitContactMessage: async () => ({
      ok: false,
      status: 400,
      error: "unused",
    }),
    listAdminContactMessages: async () => unused(),
    actOnContactMessage: async () => unused(),
    signInSchoolAccount: async () => unused(),
    readSchoolAccountSession: async () => unused(),
    changeSchoolAccountPassword: async () => unused(),
    claimSchoolAccountUsername: async () => unused(),
    lookupSchoolAccountUsername: async () => unused(),
    readAppAbbreviation: async () => unused(),
    claimAppAbbreviation: async () => unused(),
    readSettingsAbbreviation: async () => unused(),
    claimSettingsAbbreviation: async () => unused(),
    signInCampusAccount: async () => unused(),
    readCampusAccountSession: async () => unused(),
    createTeacher: async () => unused(),
    listSchoolTeachers: async () => unused(),
    resendTeacherCredentials: async () => unused(),
    changeTeacherPassword: async () => unused(),
    createStaff: async () => unused(),
    listSchoolStaff: async () => unused(),
    resendStaffCredentials: async () => unused(),
    changeStaffPassword: async () => unused(),
    createStudent: async () => unused(),
    listSchoolStudents: async () => unused(),
    resendStudentCredentials: async () => unused(),
    changeStudentPassword: async () => unused(),
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

  it("requires an admin session", async () => {
    const response = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { "x-school-host": "admin.e-school.et:3000" },
    });
    assert.equal(response.status, 401);
  });

  it("rejects a school host", async () => {
    const response = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: {
        authorization: "Bearer tok",
        "x-school-host": "north-hall.e-school.et:3000",
      },
    });
    assert.equal(response.status, 403);
  });

  it("returns derived serving and counters from the stats row", async () => {
    const pending = await store.insertPending({
      name: "North Hall",
      email: "head@north-hall.et",
      passwordHash: "hash-1",
      founded: "Founded 2026",
    });
    assert.equal(pending.ok, true);
    if (!pending.ok) {
      return;
    }
    const claimed = await store.claimSlug({
      id: pending.tenant.id,
      slug: "north-hall",
    });
    assert.equal(claimed.ok, true);

    const second = await store.insertPending({
      name: "East Yard",
      email: "head@east-yard.et",
      passwordHash: "hash-2",
      founded: "Founded 2026",
    });
    assert.equal(second.ok, true);

    const response = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: {
        authorization: "Bearer tok",
        "x-school-host": "admin.e-school.et:3000",
      },
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      schoolCount: number;
      activeCount: number;
      pendingSetupCount: number;
      suspendedCount: number;
      servingPercent: number;
      createdByYear: Record<string, number>;
      newest: { name: string; status: string }[];
    };
    assert.equal(body.schoolCount, 2);
    assert.equal(body.activeCount, 1);
    assert.equal(body.pendingSetupCount, 1);
    assert.equal(body.suspendedCount, 0);
    assert.equal(body.servingPercent, 50);
    assert.deepEqual(body.createdByYear, { "2026": 2 });
    assert.equal(body.newest.length, 2);
    assert.equal(body.newest[0]?.name, "East Yard");
    assert.equal(body.newest[0]?.status, "pending_setup");
  });
});
