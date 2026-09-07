import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { AddressInfo } from "node:net";
import { createChangeSchoolAccountPassword } from "../../application/school-accounts/change-password.ts";
import { createClaimSchoolAccountUsername } from "../../application/school-accounts/claim-username.ts";
import { createClaimAppAbbreviation } from "../../application/school-accounts/claim-abbreviation.ts";
import { createLookupSchoolAccountUsername } from "../../application/school-accounts/lookup-username.ts";
import { createReadAppAbbreviation } from "../../application/school-accounts/read-abbreviation.ts";
import { createClaimSettingsAbbreviation } from "../../application/school-settings/claim-abbreviation.ts";
import { createReadSettingsAbbreviation } from "../../application/school-settings/read-abbreviation.ts";
import { createReadCampusAccountSession } from "../../application/school-accounts/read-campus-session.ts";
import { createReadSchoolAccountSession } from "../../application/school-accounts/read-session.ts";
import { createSignInCampusAccount } from "../../application/school-accounts/sign-in-campus.ts";
import { createSignInSchoolAccount } from "../../application/school-accounts/sign-in.ts";
import { createEmptyTenantDirectory } from "../../application/public-host/empty-tenant-directory.ts";
import { createResolvePublicHost } from "../../application/public-host/resolve-public-host.ts";
import { createLookupTenantUsername } from "../../application/tenants/lookup-tenant-username.ts";
import { createMemoryStaffStore } from "../../application/staff/memory-staff-store.ts";
import { createMemoryStudentStore } from "../../application/students/memory-student-store.ts";
import { createMemoryTeacherStore } from "../../application/teachers/memory-teacher-store.ts";
import { createMemoryTenantStore } from "../../application/tenants/memory-tenant-store.ts";
import type { LoggerPort } from "../../domain/ports/logger-port.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
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

const hasher: PasswordHasherPort = {
  async hash(password) {
    return `hash:${password}`;
  },
  async verify(passwordHash, password) {
    return passwordHash === `hash:${password}`;
  },
};

function unusedAdmin() {
  return {
    ok: false as const,
    status: 403 as const,
    error: "unused",
  };
}

const secret = "a-very-long-session-secret-value";
const rootHost = "e-school.et";
const appHost = "app.e-school.et:3000";

describe("createApp /school-accounts", () => {
  const store = createMemoryTenantStore();
  const teachers = createMemoryTeacherStore();
  const staffs = createMemoryStaffStore();
  const students = createMemoryStudentStore();
  const sessions = createHmacSchoolSessionSigner({
    secret,
    ttlSeconds: 3600,
    now: () => new Date("2026-09-06T12:00:00.000Z"),
  });
  const server = createApp({
    logger: silentLogger,
    getHealth: async () => ({
      ok: true,
      service: "backend-service",
      database: "up",
    }),
    signInPlatformAdmin: async () => unusedAdmin(),
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
    lookupTenantUsername: createLookupTenantUsername({ rootHost, store }),
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
    signInSchoolAccount: createSignInSchoolAccount({
      rootHost,
      store,
      hasher,
      sessions,
    }),
    readSchoolAccountSession: createReadSchoolAccountSession({
      rootHost,
      store,
      sessions,
    }),
    changeSchoolAccountPassword: createChangeSchoolAccountPassword({
      rootHost,
      store,
      hasher,
    }),
    claimSchoolAccountUsername: createClaimSchoolAccountUsername({
      rootHost,
      store,
    }),
    lookupSchoolAccountUsername: createLookupSchoolAccountUsername({
      rootHost,
      store,
    }),
    readAppAbbreviation: createReadAppAbbreviation({
      rootHost,
      tenants: store,
      sessions,
    }),
    claimAppAbbreviation: createClaimAppAbbreviation({
      rootHost,
      tenants: store,
      sessions,
    }),
    readSettingsAbbreviation: createReadSettingsAbbreviation({
      rootHost,
      tenants: store,
      sessions,
    }),
    claimSettingsAbbreviation: createClaimSettingsAbbreviation({
      rootHost,
      tenants: store,
      sessions,
    }),
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
  let pendingId = "";
  let suspendedEmail = "paused@north-hall.et";
  let claimedEmail = "claimed@north-hall.et";

  before(async () => {
    const pending = await store.insertPending({
      name: "North Hall",
      email: "head@north-hall.et",
      passwordHash: "hash:temporary-pass",
      founded: "Founded 2026",
    });
    assert.equal(pending.ok, true);
    if (pending.ok) {
      pendingId = pending.tenant.id;
    }

    const suspended = await store.insertPending({
      name: "Paused Hall",
      email: suspendedEmail,
      passwordHash: "hash:temporary-pass",
      founded: "Founded 2026",
    });
    assert.equal(suspended.ok, true);
    if (suspended.ok) {
      await store.setStatus(suspended.tenant.id, "suspended");
    }

    const claimed = await store.insertPending({
      name: "Claimed Hall",
      email: claimedEmail,
      passwordHash: "hash:temporary-pass",
      founded: "Founded 2026",
    });
    assert.equal(claimed.ok, true);
    if (claimed.ok) {
      await store.updatePassword({
        id: claimed.tenant.id,
        passwordHash: "hash:temporary-pass",
        mustChangePassword: false,
      });
      await store.claimSlug({ id: claimed.tenant.id, slug: "claimed-hall" });
    }

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

  function appHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      "content-type": "application/json",
      "x-school-host": appHost,
      ...extra,
    };
  }

  async function signIn(email = "head@north-hall.et", password = "temporary-pass") {
    return fetch(`${baseUrl}/school-accounts/session`, {
      method: "POST",
      headers: appHeaders(),
      body: JSON.stringify({ email, password }),
    });
  }

  it("signs in with good credentials on the app host", async () => {
    const response = await signIn();
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      accountId: string;
      email: string;
      token: string;
      mustChangePassword: boolean;
      nextStep: string;
    };
    assert.equal(body.accountId, pendingId);
    assert.equal(body.email, "head@north-hall.et");
    assert.equal(body.mustChangePassword, true);
    assert.equal(body.nextStep, "password");
    assert.ok(body.token.length > 0);

    const setCookie = response.headers.getSetCookie();
    assert.equal(
      setCookie.some((cookie) => cookie.startsWith("platform_admin_session=")),
      false,
    );
  });

  it("rejects a wrong password", async () => {
    const response = await signIn("head@north-hall.et", "wrong-password");
    assert.equal(response.status, 401);
  });

  it("rejects the admin host", async () => {
    const response = await fetch(`${baseUrl}/school-accounts/session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-school-host": "admin.e-school.et:3000",
      },
      body: JSON.stringify({
        email: "head@north-hall.et",
        password: "temporary-pass",
      }),
    });
    assert.equal(response.status, 403);
  });

  it("rejects a campus host", async () => {
    const response = await fetch(`${baseUrl}/school-accounts/session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-school-host": "north-hall.e-school.et:3000",
      },
      body: JSON.stringify({
        email: "head@north-hall.et",
        password: "temporary-pass",
      }),
    });
    assert.equal(response.status, 403);
  });

  it("rejects a suspended account", async () => {
    const response = await signIn(suspendedEmail);
    assert.equal(response.status, 403);
  });

  it("rejects GET session after the account is suspended", async () => {
    const extra = await store.insertPending({
      name: "Later Paused",
      email: "later-paused@north-hall.et",
      passwordHash: "hash:temporary-pass",
      founded: "Founded 2026",
    });
    assert.equal(extra.ok, true);
    if (!extra.ok) {
      throw new Error("insert failed");
    }
    const signedIn = await signIn("later-paused@north-hall.et");
    const session = (await signedIn.json()) as { token: string };
    await store.setStatus(extra.tenant.id, "suspended");
    const response = await fetch(`${baseUrl}/school-accounts/session`, {
      headers: appHeaders({ authorization: `Bearer ${session.token}` }),
    });
    assert.equal(response.status, 403);
    const body = (await response.json()) as { error: string };
    assert.equal(body.error, "This school account is suspended");
  });

  it("keeps the app session after a slug until the abbreviation is saved", async () => {
    const response = await signIn(claimedEmail);
    assert.equal(response.status, 200);
    const body = (await response.json()) as { nextStep: string };
    assert.equal(body.nextStep, "abbreviation");
  });

  it("rejects a platform admin session token", async () => {
    const admin = createHmacSessionSigner({
      secret,
      ttlSeconds: 3600,
      now: () => new Date("2026-09-06T12:00:00.000Z"),
    });
    const issued = admin.issue("admin@e-school.et");
    const response = await fetch(`${baseUrl}/school-accounts/session`, {
      headers: appHeaders({ authorization: `Bearer ${issued.token}` }),
    });
    assert.equal(response.status, 401);
  });

  it("changes the password and then asks for a username next", async () => {
    const signedIn = await signIn();
    const session = (await signedIn.json()) as { token: string };
    const response = await fetch(`${baseUrl}/school-accounts/password`, {
      method: "POST",
      headers: appHeaders({ authorization: `Bearer ${session.token}` }),
      body: JSON.stringify({
        currentPassword: "temporary-pass",
        newPassword: "a-kept-password",
      }),
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      mustChangePassword: boolean;
      nextStep: string;
    };
    assert.equal(body.mustChangePassword, false);
    assert.equal(body.nextStep, "username");

    const me = await fetch(`${baseUrl}/school-accounts/session`, {
      headers: appHeaders({ authorization: `Bearer ${session.token}` }),
    });
    assert.equal(me.status, 200);
    const current = (await me.json()) as { nextStep: string };
    assert.equal(current.nextStep, "username");
  });

  it("rejects a new password equal to the current one", async () => {
    const extra = await store.insertPending({
      name: "East Yard",
      email: "head@east-yard.et",
      passwordHash: "hash:temporary-pass",
      founded: "Founded 2026",
    });
    assert.equal(extra.ok, true);
    const signedIn = await signIn("head@east-yard.et");
    const session = (await signedIn.json()) as { token: string };
    const response = await fetch(`${baseUrl}/school-accounts/password`, {
      method: "POST",
      headers: appHeaders({ authorization: `Bearer ${session.token}` }),
      body: JSON.stringify({
        currentPassword: "temporary-pass",
        newPassword: "temporary-pass",
      }),
    });
    assert.equal(response.status, 400);
  });

  it("rejects a username claim before the password is changed", async () => {
    const extra = await store.insertPending({
      name: "Claim Gate",
      email: "head@claim-gate.et",
      passwordHash: "hash:temporary-pass",
      founded: "Founded 2026",
    });
    assert.equal(extra.ok, true);
    const signedIn = await signIn("head@claim-gate.et");
    const session = (await signedIn.json()) as { token: string };
    const response = await fetch(`${baseUrl}/school-accounts/username`, {
      method: "POST",
      headers: appHeaders({ authorization: `Bearer ${session.token}` }),
      body: JSON.stringify({ slug: "claim-gate" }),
    });
    assert.equal(response.status, 409);
    const body = (await response.json()) as { error: string };
    assert.equal(body.error, "Change your password first");
  });

  it("looks up usernames on a school session the same way as admin", async () => {
    const extra = await store.insertPending({
      name: "Lookup Hall",
      email: "head@lookup-hall.et",
      passwordHash: "hash:temporary-pass",
      founded: "Founded 2026",
    });
    assert.equal(extra.ok, true);
    if (extra.ok) {
      await store.updatePassword({
        id: extra.tenant.id,
        passwordHash: "hash:a-kept-password",
        mustChangePassword: false,
      });
    }
    const signedIn = await signIn("head@lookup-hall.et", "a-kept-password");
    const session = (await signedIn.json()) as { token: string };

    for (const slug of ["app", "admin", "claimed-hall", "-nope-"]) {
      const school = await fetch(
        `${baseUrl}/school-accounts/username?slug=${encodeURIComponent(slug)}`,
        {
          headers: appHeaders({ authorization: `Bearer ${session.token}` }),
        },
      );
      const admin = await fetch(
        `${baseUrl}/admin/tenants/username?slug=${encodeURIComponent(slug)}`,
        {
          headers: {
            authorization: "Bearer tok",
            "x-school-host": "admin.e-school.et:3000",
          },
        },
      );
      assert.equal(school.status, 200);
      assert.equal(admin.status, 200);
      assert.deepEqual(await school.json(), await admin.json());
    }
  });

  it("claims a username, then an abbreviation, then sends the director to campus", async () => {
    const extra = await store.insertPending({
      name: "River Hall",
      email: "head@river-hall.et",
      passwordHash: "hash:temporary-pass",
      founded: "Founded 2026",
    });
    assert.equal(extra.ok, true);
    if (extra.ok) {
      await store.updatePassword({
        id: extra.tenant.id,
        passwordHash: "hash:a-kept-password",
        mustChangePassword: false,
      });
    }
    const signedIn = await signIn("head@river-hall.et", "a-kept-password");
    const session = (await signedIn.json()) as { token: string };

    const reserved = await fetch(`${baseUrl}/school-accounts/username`, {
      method: "POST",
      headers: appHeaders({ authorization: `Bearer ${session.token}` }),
      body: JSON.stringify({ slug: "app" }),
    });
    assert.equal(reserved.status, 400);

    const claimed = await fetch(`${baseUrl}/school-accounts/username`, {
      method: "POST",
      headers: appHeaders({ authorization: `Bearer ${session.token}` }),
      body: JSON.stringify({ slug: "river-hall" }),
    });
    assert.equal(claimed.status, 200);
    assert.deepEqual(await claimed.json(), {
      host: "river-hall.e-school.et",
      slug: "river-hall",
    });

    const found = await store.findBySlug("river-hall");
    assert.equal(found?.status, "active");
    assert.equal(found?.slug, "river-hall");
    assert.equal(found?.abbreviation, null);

    const second = await fetch(`${baseUrl}/school-accounts/username`, {
      method: "POST",
      headers: appHeaders({ authorization: `Bearer ${session.token}` }),
      body: JSON.stringify({ slug: "other-hall" }),
    });
    assert.equal(second.status, 409);

    const me = await fetch(`${baseUrl}/school-accounts/session`, {
      headers: appHeaders({ authorization: `Bearer ${session.token}` }),
    });
    assert.equal(me.status, 200);
    const current = (await me.json()) as { nextStep: string };
    assert.equal(current.nextStep, "abbreviation");

    const preview = await fetch(`${baseUrl}/school-accounts/abbreviation`, {
      headers: appHeaders({ authorization: `Bearer ${session.token}` }),
    });
    assert.equal(preview.status, 200);
    const previewBody = (await preview.json()) as {
      suggested: string;
      locked: boolean;
    };
    assert.equal(previewBody.suggested, "AAA");
    assert.equal(previewBody.locked, false);

    const saved = await fetch(`${baseUrl}/school-accounts/abbreviation`, {
      method: "POST",
      headers: appHeaders({ authorization: `Bearer ${session.token}` }),
      body: JSON.stringify({}),
    });
    assert.equal(saved.status, 200);
    assert.deepEqual(await saved.json(), {
      abbreviation: "AAA",
      host: "river-hall.e-school.et",
      slug: "river-hall",
    });

    const done = await fetch(`${baseUrl}/school-accounts/session`, {
      headers: appHeaders({ authorization: `Bearer ${session.token}` }),
    });
    assert.equal(done.status, 401);

    const campus = await fetch(`${baseUrl}/school-accounts/campus-session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-school-host": "river-hall.e-school.et:3000",
      },
      body: JSON.stringify({
        email: "head@river-hall.et",
        password: "a-kept-password",
      }),
    });
    assert.equal(campus.status, 200);
    const campusBody = (await campus.json()) as {
      slug: string;
      token: string;
      kind: string;
      mustChangePassword: boolean;
    };
    assert.equal(campusBody.slug, "river-hall");
    assert.equal(campusBody.kind, "director");
    assert.equal(campusBody.mustChangePassword, false);
    assert.ok(campusBody.token.length > 0);

    const appAgain = await signIn("head@river-hall.et", "a-kept-password");
    assert.equal(appAgain.status, 403);
  });

  it("rejects a short password", async () => {
    const extra = await store.insertPending({
      name: "West Yard",
      email: "head@west-yard.et",
      passwordHash: "hash:temporary-pass",
      founded: "Founded 2026",
    });
    assert.equal(extra.ok, true);
    const signedIn = await signIn("head@west-yard.et");
    const session = (await signedIn.json()) as { token: string };
    const response = await fetch(`${baseUrl}/school-accounts/password`, {
      method: "POST",
      headers: appHeaders({ authorization: `Bearer ${session.token}` }),
      body: JSON.stringify({
        currentPassword: "temporary-pass",
        newPassword: "short-pass",
      }),
    });
    assert.equal(response.status, 400);
  });
});
