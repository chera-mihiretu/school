import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { AddressInfo } from "node:net";
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

describe("createApp admin session", () => {
  const server = createApp({
    logger: silentLogger,
    getHealth: async () => ({
      ok: true,
      service: "backend-service",
      database: "up",
    }),
    signInPlatformAdmin: async (input) => {
      if (!input.hostHeader.includes("admin.e-school.et")) {
        return {
          ok: false,
          status: 403,
          error: "Admin login is only allowed on the admin host",
        };
      }
      if (input.password !== "secret") {
        return { ok: false, status: 401, error: "Invalid email or password" };
      }
      return {
        ok: true,
        session: {
          email: input.email.trim().toLowerCase(),
          token: "tok",
          expiresAt: "2026-09-05T12:00:00.000Z",
        },
      };
    },
    readPlatformAdminSession: (token) =>
      token === "tok"
        ? { email: "admin@e-school.et", expiresAt: "2026-09-05T12:00:00.000Z" }
        : undefined,
    listPublicFeaturedSchools: async () => ({ schools: [] }),
    resolvePublicHost: createResolvePublicHost({
      rootHost: "e-school.et",
      tenants: createEmptyTenantDirectory(),
    }),
    listAdminFeaturedSchools: async () => ({ ok: true, schools: [] }),
    createFeaturedSchool: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    updateFeaturedSchool: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    deleteFeaturedSchool: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    createTenant: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    listAdminTenants: async () => ({
      ok: true,
      schools: [],
      page: 1,
      pageSize: 10,
      total: 0,
    }),
    getAdminDashboard: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    lookupTenantUsername: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    suspendTenant: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    reactivateTenant: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    resendTenantCredentials: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    submitContactMessage: async () => ({
      ok: false,
      status: 400,
      error: "unused",
    }),
    listAdminContactMessages: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    actOnContactMessage: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    signInSchoolAccount: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    readSchoolAccountSession: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    changeSchoolAccountPassword: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    claimSchoolAccountUsername: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    lookupSchoolAccountUsername: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    readAppAbbreviation: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    claimAppAbbreviation: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    readSettingsAbbreviation: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    claimSettingsAbbreviation: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    signInCampusAccount: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    readCampusAccountSession: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    createTeacher: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    listSchoolTeachers: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    resendTeacherCredentials: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    changeTeacherPassword: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    createStaff: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    listSchoolStaff: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    resendStaffCredentials: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    changeStaffPassword: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    createStudent: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    listSchoolStudents: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    resendStudentCredentials: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
    changeStudentPassword: async () => ({
      ok: false,
      status: 403,
      error: "unused",
    }),
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

  it("signs in from the admin host", async () => {
    const response = await fetch(`${baseUrl}/admin/session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-school-host": "admin.e-school.et:3000",
      },
      body: JSON.stringify({
        email: "Admin@e-school.et",
        password: "secret",
      }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      email: "admin@e-school.et",
      token: "tok",
      expiresAt: "2026-09-05T12:00:00.000Z",
    });
  });

  it("rejects school hosts and missing tokens", async () => {
    const forbidden = await fetch(`${baseUrl}/admin/session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-school-host": "demo.e-school.et:3000",
      },
      body: JSON.stringify({ email: "admin@e-school.et", password: "secret" }),
    });
    assert.equal(forbidden.status, 403);

    const unauthorized = await fetch(`${baseUrl}/admin/session`);
    assert.equal(unauthorized.status, 401);
  });

  it("reads and clears a session", async () => {
    const me = await fetch(`${baseUrl}/admin/session`, {
      headers: { authorization: "Bearer tok" },
    });
    assert.equal(me.status, 200);
    assert.deepEqual(await me.json(), {
      email: "admin@e-school.et",
      expiresAt: "2026-09-05T12:00:00.000Z",
    });

    const signOut = await fetch(`${baseUrl}/admin/session`, { method: "DELETE" });
    assert.equal(signOut.status, 200);
    assert.deepEqual(await signOut.json(), { ok: true });
  });

  it("resolves the admin host for guests", async () => {
    const response = await fetch(`${baseUrl}/public/resolve`, {
      headers: { "x-school-host": "admin.e-school.et:3000" },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      kind: "admin",
      host: "admin.e-school.et",
      rootHost: "e-school.et",
    });
  });

  it("resolves the app host for guests", async () => {
    const response = await fetch(`${baseUrl}/public/resolve`, {
      headers: { "x-school-host": "app.e-school.et:3000" },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      kind: "app",
      host: "app.e-school.et",
      rootHost: "e-school.et",
    });
  });

  it("resolves the apex for guests", async () => {
    const response = await fetch(`${baseUrl}/public/resolve`, {
      headers: { "x-school-host": "e-school.et:3000" },
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as { kind: string };
    assert.equal(body.kind, "apex");
  });
});
