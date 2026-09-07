import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryTenantStore } from "./memory-tenant-store.ts";

describe("createMemoryTenantStore", () => {
  it("inserts a pending school with a null slug", async () => {
    const store = createMemoryTenantStore();
    const inserted = await store.insertPending({
      name: "North Hall",
      email: "Head@North-Hall.et",
      passwordHash: "hash-1",
      founded: "Founded 2026",
    });

    assert.equal(inserted.ok, true);
    if (!inserted.ok) {
      return;
    }
    assert.equal(inserted.tenant.slug, null);
    assert.equal(inserted.tenant.email, "head@north-hall.et");
    assert.equal(inserted.tenant.status, "pending_setup");
    assert.equal(inserted.tenant.mustChangePassword, true);
    assert.equal(await store.findBySlug("north-hall"), undefined);
    const found = await store.findByEmail("HEAD@north-hall.et");
    assert.equal(found?.id, inserted.tenant.id);
  });

  it("rejects a duplicate email", async () => {
    const store = createMemoryTenantStore();
    const first = await store.insertPending({
      name: "North Hall",
      email: "head@north-hall.et",
      passwordHash: "hash-1",
      founded: "Founded 2026",
    });
    assert.equal(first.ok, true);

    const duplicate = await store.insertPending({
      name: "North Hall Two",
      email: "Head@North-Hall.et",
      passwordHash: "hash-2",
      founded: "Founded 2026",
    });
    assert.deepEqual(duplicate, { ok: false, reason: "email_taken" });
  });

  it("claims a slug once and then reports already_claimed", async () => {
    const store = createMemoryTenantStore();
    const inserted = await store.insertPending({
      name: "North Hall",
      email: "head@north-hall.et",
      passwordHash: "hash-1",
      founded: "Founded 2026",
    });
    assert.equal(inserted.ok, true);
    if (!inserted.ok) {
      return;
    }

    const claimed = await store.claimSlug({
      id: inserted.tenant.id,
      slug: "north-hall",
    });
    assert.equal(claimed.ok, true);
    if (!claimed.ok) {
      return;
    }
    assert.equal(claimed.tenant.slug, "north-hall");
    assert.equal(claimed.tenant.status, "active");
    assert.equal((await store.findBySlug("north-hall"))?.id, inserted.tenant.id);

    const second = await store.claimSlug({
      id: inserted.tenant.id,
      slug: "east-yard",
    });
    assert.deepEqual(second, { ok: false, reason: "already_claimed" });
    assert.equal((await store.findBySlug("north-hall"))?.slug, "north-hall");
  });

  it("rejects a slug already taken by another tenant", async () => {
    const store = createMemoryTenantStore();
    const first = await store.insert({
      name: "North Hall",
      slug: "north-hall",
      founded: "Founded 2026",
    });
    assert.equal(first.ok, true);

    const pending = await store.insertPending({
      name: "East Yard",
      email: "head@east-yard.et",
      passwordHash: "hash-2",
      founded: "Founded 2026",
    });
    assert.equal(pending.ok, true);
    if (!pending.ok) {
      return;
    }

    const taken = await store.claimSlug({
      id: pending.tenant.id,
      slug: "north-hall",
    });
    assert.deepEqual(taken, { ok: false, reason: "slug_taken" });
    assert.equal((await store.findByEmail("head@east-yard.et"))?.slug, null);
  });

  it("updates a password and reports not_found for unknown ids", async () => {
    const store = createMemoryTenantStore();
    const inserted = await store.insertPending({
      name: "North Hall",
      email: "head@north-hall.et",
      passwordHash: "hash-1",
      founded: "Founded 2026",
    });
    assert.equal(inserted.ok, true);
    if (!inserted.ok) {
      return;
    }

    const updated = await store.updatePassword({
      id: inserted.tenant.id,
      passwordHash: "hash-2",
      mustChangePassword: false,
    });
    assert.equal(updated.ok, true);
    if (updated.ok) {
      assert.equal(updated.tenant.mustChangePassword, false);
    }

    const missing = await store.updatePassword({
      id: "11111111-1111-1111-1111-111111111111",
      passwordHash: "hash-3",
      mustChangePassword: false,
    });
    assert.deepEqual(missing, { ok: false, reason: "not_found" });

    const auth = await store.findAuthByEmail("head@north-hall.et");
    assert.equal(auth?.passwordHash, "hash-2");
    assert.equal((await store.findAuthById(inserted.tenant.id))?.passwordHash, "hash-2");
  });

  it("records a mail attempt and the first director sign-in", async () => {
    const store = createMemoryTenantStore();
    const inserted = await store.insertPending({
      name: "North Hall",
      email: "head@north-hall.et",
      passwordHash: "hash-1",
      founded: "Founded 2026",
    });
    assert.equal(inserted.ok, true);
    if (!inserted.ok) {
      return;
    }
    assert.equal(inserted.tenant.lastMailAt, null);
    assert.equal(inserted.tenant.lastMailOk, null);
    assert.equal(inserted.tenant.signedInAt, null);

    const mailed = await store.recordMailAttempt(inserted.tenant.id, {
      ok: true,
      at: new Date("2026-09-07T08:00:00.000Z"),
    });
    assert.equal(mailed.ok, true);
    if (mailed.ok) {
      assert.equal(mailed.tenant.lastMailOk, true);
      assert.equal(mailed.tenant.lastMailError, null);
      assert.deepEqual(mailed.tenant.lastMailAt, new Date("2026-09-07T08:00:00.000Z"));
    }

    const failed = await store.recordMailAttempt(inserted.tenant.id, {
      ok: false,
      error: "SMTP refused the message",
      at: new Date("2026-09-07T08:05:00.000Z"),
    });
    assert.equal(failed.ok, true);
    if (failed.ok) {
      assert.equal(failed.tenant.lastMailOk, false);
      assert.equal(failed.tenant.lastMailError, "SMTP refused the message");
    }

    const first = await store.recordDirectorSignIn(
      inserted.tenant.id,
      new Date("2026-09-07T09:00:00.000Z"),
    );
    assert.equal(first.ok, true);
    if (first.ok) {
      assert.deepEqual(first.tenant.signedInAt, new Date("2026-09-07T09:00:00.000Z"));
    }

    const second = await store.recordDirectorSignIn(
      inserted.tenant.id,
      new Date("2026-09-07T10:00:00.000Z"),
    );
    assert.equal(second.ok, true);
    if (second.ok) {
      assert.deepEqual(second.tenant.signedInAt, new Date("2026-09-07T09:00:00.000Z"));
    }

    const missingMail = await store.recordMailAttempt(
      "11111111-1111-1111-1111-111111111111",
      { ok: true, at: new Date() },
    );
    assert.deepEqual(missingMail, { ok: false, reason: "not_found" });

    const missingSignIn = await store.recordDirectorSignIn(
      "11111111-1111-1111-1111-111111111111",
      new Date(),
    );
    assert.deepEqual(missingSignIn, { ok: false, reason: "not_found" });
  });

  it("keeps dashboard counters in sync across create, claim, and status", async () => {
    const store = createMemoryTenantStore();
    const empty = await store.readDashboardStats();
    assert.equal(empty.schoolCount, 0);
    assert.equal(empty.activeCount, 0);

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

    const afterCreate = await store.readDashboardStats();
    assert.equal(afterCreate.schoolCount, 1);
    assert.equal(afterCreate.pendingSetupCount, 1);
    assert.equal(afterCreate.activeCount, 0);
    assert.deepEqual(afterCreate.createdByYear, { "2026": 1 });
    assert.equal(afterCreate.newest[0]?.id, pending.tenant.id);
    assert.equal(afterCreate.newest[0]?.status, "pending_setup");

    const claimed = await store.claimSlug({
      id: pending.tenant.id,
      slug: "north-hall",
    });
    assert.equal(claimed.ok, true);

    const afterClaim = await store.readDashboardStats();
    assert.equal(afterClaim.pendingSetupCount, 0);
    assert.equal(afterClaim.activeCount, 1);
    assert.equal(afterClaim.newest[0]?.status, "active");
    assert.equal(afterClaim.newest[0]?.slug, "north-hall");

    const suspended = await store.setStatus(pending.tenant.id, "suspended");
    assert.equal(suspended.ok, true);
    const afterSuspend = await store.readDashboardStats();
    assert.equal(afterSuspend.activeCount, 0);
    assert.equal(afterSuspend.suspendedCount, 1);
    assert.equal(afterSuspend.newest[0]?.status, "suspended");
  });

  it("backfills seeded tenants once and caps newest at three", async () => {
    const seeded = [1, 2, 3, 4].map((index) => {
      const stamp = String(index).padStart(2, "0");
      return {
        id: `11111111-1111-1111-1111-1111111111${stamp}`,
        name: `School ${index}`,
        slug: `school-${index}`,
        email: null,
        status: "active" as const,
        founded: "Founded 2026",
        createdAt: new Date(`2026-09-0${index}T10:00:00.000Z`),
        mustChangePassword: false,
        lastMailAt: null,
        lastMailOk: null,
        lastMailError: null,
        signedInAt: null,
        abbreviation: null,
      };
    });
    const store = createMemoryTenantStore(seeded);
    await store.ensureSchema();

    const stats = await store.readDashboardStats();
    assert.equal(stats.schoolCount, 4);
    assert.equal(stats.activeCount, 4);
    assert.deepEqual(stats.createdByYear, { "2026": 4 });
    assert.equal(stats.newest.length, 3);
    assert.deepEqual(
      stats.newest.map((school) => school.name),
      ["School 4", "School 3", "School 2"],
    );

    const live = await store.insert({
      name: "West Quay",
      slug: "west-quay",
      founded: "Founded 2026",
    });
    assert.equal(live.ok, true);
    const afterInsert = await store.readDashboardStats();
    assert.equal(afterInsert.schoolCount, 5);
    assert.equal(afterInsert.activeCount, 5);
    assert.equal(afterInsert.newest[0]?.name, "West Quay");
    assert.equal(afterInsert.newest.length, 3);
  });

  it("backfills before a claim so seeded pending schools do not double-count", async () => {
    const pending = {
      id: "11111111-1111-1111-1111-111111111111",
      name: "North Hall",
      slug: null,
      email: "head@north-hall.et",
      status: "pending_setup" as const,
      founded: "Founded 2026",
      createdAt: new Date("2026-09-06T12:00:00.000Z"),
      mustChangePassword: true,
      lastMailAt: null,
      lastMailOk: null,
      lastMailError: null,
      signedInAt: null,
      abbreviation: null,
    };
    const store = createMemoryTenantStore([pending]);
    const claimed = await store.claimSlug({
      id: pending.id,
      slug: "north-hall",
    });
    assert.equal(claimed.ok, true);
    const stats = await store.readDashboardStats();
    assert.equal(stats.schoolCount, 1);
    assert.equal(stats.pendingSetupCount, 0);
    assert.equal(stats.activeCount, 1);
    assert.equal(stats.newest[0]?.status, "active");
  });

  it("does not change counters when a write is rejected", async () => {
    const store = createMemoryTenantStore();
    const first = await store.insertPending({
      name: "North Hall",
      email: "head@north-hall.et",
      passwordHash: "hash-1",
      founded: "Founded 2026",
    });
    assert.equal(first.ok, true);

    const duplicate = await store.insertPending({
      name: "North Hall Two",
      email: "Head@North-Hall.et",
      passwordHash: "hash-2",
      founded: "Founded 2026",
    });
    assert.deepEqual(duplicate, { ok: false, reason: "email_taken" });

    const stats = await store.readDashboardStats();
    assert.equal(stats.schoolCount, 1);
    assert.equal(stats.pendingSetupCount, 1);
  });
});


