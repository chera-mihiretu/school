import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { AddressInfo } from "node:net";
import { createActOnContactMessage } from "../../application/contact-messages/act-on-contact-message.ts";
import { createListAdminContactMessages } from "../../application/contact-messages/list-admin-contact-messages.ts";
import { createMemoryContactMessageStore } from "../../application/contact-messages/memory-contact-message-store.ts";
import { createSubmitContactMessage } from "../../application/contact-messages/submit-contact-message.ts";
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

function unusedAdmin(): {
  ok: false;
  status: 403;
  error: string;
} {
  return { ok: false, status: 403, error: "unused" };
}

describe("createApp contact messages", () => {
  const store = createMemoryContactMessageStore();
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
    submitContactMessage: createSubmitContactMessage({ store }),
    listAdminContactMessages: createListAdminContactMessages({
      rootHost,
      store,
    }),
    actOnContactMessage: createActOnContactMessage({
      rootHost,
      store,
    }),
    signInSchoolAccount: async () => unusedAdmin(),
    readSchoolAccountSession: async () => unusedAdmin(),
    changeSchoolAccountPassword: async () => unusedAdmin(),
    claimSchoolAccountUsername: async () => unusedAdmin(),
    lookupSchoolAccountUsername: async () => unusedAdmin(),
    readAppAbbreviation: async () => unusedAdmin(),
    claimAppAbbreviation: async () => unusedAdmin(),
    readSettingsAbbreviation: async () => unusedAdmin(),
    claimSettingsAbbreviation: async () => unusedAdmin(),
    signInCampusAccount: async () => unusedAdmin(),
    readCampusAccountSession: async () => unusedAdmin(),
    createTeacher: async () => unusedAdmin(),
    listSchoolTeachers: async () => unusedAdmin(),
    resendTeacherCredentials: async () => unusedAdmin(),
    changeTeacherPassword: async () => unusedAdmin(),
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

  it("rejects invalid public contact posts", async () => {
    const missing = await fetch(`${baseUrl}/public/contact`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ada", email: "ada@school.et" }),
    });
    assert.equal(missing.status, 400);

    const badEmail = await fetch(`${baseUrl}/public/contact`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        school: "North Hall",
        name: "Ada",
        email: "not-an-email",
      }),
    });
    assert.equal(badEmail.status, 400);
  });

  it("accepts a public contact post without auth", async () => {
    const response = await fetch(`${baseUrl}/public/contact`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        school: "North Hall",
        name: "Ada Lemma",
        role: "Director",
        email: "ada@north-hall.edu",
        note: "We would like a campus.",
      }),
    });
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { ok: true });
  });

  it("requires an admin session to list messages", async () => {
    const response = await fetch(`${baseUrl}/admin/contact-messages`, {
      headers: { "x-school-host": "admin.e-school.et" },
    });
    assert.equal(response.status, 401);
  });

  it("rejects school hosts on the admin list", async () => {
    const response = await fetch(`${baseUrl}/admin/contact-messages`, {
      headers: {
        authorization: "Bearer tok",
        "x-school-host": "north-hall.e-school.et",
      },
    });
    assert.equal(response.status, 403);
  });

  it("lists newest messages first for the admin host", async () => {
    const second = await fetch(`${baseUrl}/public/contact`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        school: "East Yard",
        name: "Bereket",
        email: "bereket@east.et",
        note: "Second",
      }),
    });
    assert.equal(second.status, 201);

    const response = await fetch(`${baseUrl}/admin/contact-messages`, {
      headers: {
        authorization: "Bearer tok",
        "x-school-host": "admin.e-school.et:3000",
      },
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      messages: { email: string; school: string; acted: boolean }[];
      total: number;
      pending: number;
    };
    assert.ok(body.total >= 2);
    assert.ok(body.pending >= 2);
    assert.equal(body.messages[0]?.email, "bereket@east.et");
    assert.equal(body.messages[0]?.school, "East Yard");
    assert.equal(body.messages[0]?.acted, false);
  });

  it("requires an admin session to act on a message", async () => {
    const listed = await fetch(`${baseUrl}/admin/contact-messages`, {
      headers: {
        authorization: "Bearer tok",
        "x-school-host": "admin.e-school.et",
      },
    });
    const body = (await listed.json()) as { messages: { id: string }[] };
    const id = body.messages[0]?.id;
    assert.ok(id);

    const response = await fetch(`${baseUrl}/admin/contact-messages/${id}/act`, {
      method: "POST",
      headers: { "x-school-host": "admin.e-school.et" },
    });
    assert.equal(response.status, 401);
  });

  it("rejects school hosts on act", async () => {
    const listed = await fetch(`${baseUrl}/admin/contact-messages`, {
      headers: {
        authorization: "Bearer tok",
        "x-school-host": "admin.e-school.et",
      },
    });
    const body = (await listed.json()) as { messages: { id: string }[] };
    const id = body.messages[0]?.id;
    assert.ok(id);

    const response = await fetch(`${baseUrl}/admin/contact-messages/${id}/act`, {
      method: "POST",
      headers: {
        authorization: "Bearer tok",
        "x-school-host": "north-hall.e-school.et",
      },
    });
    assert.equal(response.status, 403);
  });

  it("marks a message acted and lists unacted first", async () => {
    const listed = await fetch(`${baseUrl}/admin/contact-messages`, {
      headers: {
        authorization: "Bearer tok",
        "x-school-host": "admin.e-school.et",
      },
    });
    const before = (await listed.json()) as {
      messages: { id: string; email: string; acted: boolean }[];
      pending: number;
    };
    const newest = before.messages[0];
    assert.ok(newest);
    assert.equal(newest.acted, false);

    const acted = await fetch(
      `${baseUrl}/admin/contact-messages/${newest.id}/act`,
      {
        method: "POST",
        headers: {
          authorization: "Bearer tok",
          "x-school-host": "admin.e-school.et:3000",
        },
      },
    );
    assert.equal(acted.status, 200);
    const actedBody = (await acted.json()) as { message: { acted: boolean } };
    assert.equal(actedBody.message.acted, true);

    const after = await fetch(`${baseUrl}/admin/contact-messages`, {
      headers: {
        authorization: "Bearer tok",
        "x-school-host": "admin.e-school.et",
      },
    });
    const afterBody = (await after.json()) as {
      messages: { id: string; acted: boolean }[];
      pending: number;
    };
    assert.equal(afterBody.pending, before.pending - 1);
    assert.equal(
      afterBody.messages.find((message) => message.id === newest.id)?.acted,
      true,
    );
    assert.equal(afterBody.messages[0]?.acted, false);
  });

  it("returns 404 for an unknown message", async () => {
    const response = await fetch(
      `${baseUrl}/admin/contact-messages/99999999-9999-9999-9999-999999999999/act`,
      {
        method: "POST",
        headers: {
          authorization: "Bearer tok",
          "x-school-host": "admin.e-school.et",
        },
      },
    );
    assert.equal(response.status, 404);
  });
});
