import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Tenant } from "./tenant.ts";
import {
  backfillDashboardStats,
  emptyDashboardStats,
  recordSchoolCreated,
  recordStatusChange,
  servingPercent,
} from "./dashboard-stats.ts";

function tenant(input: {
  index: number;
  status: Tenant["status"];
  created: string;
}): Tenant {
  const stamp = String(input.index).padStart(2, "0");
  return {
    id: `11111111-1111-1111-1111-1111111111${stamp}`,
    name: `School ${input.index}`,
    slug: input.status === "pending_setup" ? null : `school-${input.index}`,
    email: `head@school-${input.index}.et`,
    status: input.status,
    founded: "Founded 2026",
    createdAt: new Date(input.created),
    mustChangePassword: false,
    lastMailAt: null,
    lastMailOk: null,
    lastMailError: null,
    signedInAt: null,
    abbreviation: null,
  };
}

const now = new Date("2026-09-07T12:00:00.000Z");

describe("servingPercent", () => {
  it("is zero when there are no schools", () => {
    assert.equal(servingPercent(0, 0), 0);
  });

  it("is the rounded share of active schools", () => {
    assert.equal(servingPercent(1, 1), 100);
    assert.equal(servingPercent(1, 3), 33);
    assert.equal(servingPercent(2, 3), 67);
  });
});

describe("backfillDashboardStats", () => {
  it("counts status buckets, year groups, and the three newest schools", () => {
    const first = tenant({
      index: 1,
      status: "active",
      created: "2025-01-01T00:00:00.000Z",
    });
    const second = tenant({
      index: 2,
      status: "pending_setup",
      created: "2026-02-01T00:00:00.000Z",
    });
    const third = tenant({
      index: 3,
      status: "suspended",
      created: "2026-03-01T00:00:00.000Z",
    });
    const fourth = tenant({
      index: 4,
      status: "active",
      created: "2026-04-01T00:00:00.000Z",
    });

    const stats = backfillDashboardStats([first, second, third, fourth], now);

    assert.equal(stats.schoolCount, 4);
    assert.equal(stats.activeCount, 2);
    assert.equal(stats.pendingSetupCount, 1);
    assert.equal(stats.suspendedCount, 1);
    assert.deepEqual(stats.createdByYear, { "2025": 1, "2026": 3 });
    assert.deepEqual(
      stats.newest.map((school) => school.id),
      [fourth.id, third.id, second.id],
    );
    assert.equal(servingPercent(stats.activeCount, stats.schoolCount), 50);
  });
});

describe("recordSchoolCreated", () => {
  it("increments counts, the year bucket, and prepends newest capped at 3", () => {
    let stats = emptyDashboardStats(now);
    const schools = [1, 2, 3, 4].map((index) =>
      tenant({
        index,
        status: "pending_setup",
        created: `2026-09-0${index}T00:00:00.000Z`,
      }),
    );

    for (const school of schools) {
      stats = recordSchoolCreated(stats, school, now);
    }

    assert.equal(stats.schoolCount, 4);
    assert.equal(stats.pendingSetupCount, 4);
    assert.equal(stats.activeCount, 0);
    assert.deepEqual(stats.createdByYear, { "2026": 4 });
    assert.equal(stats.newest.length, 3);
    assert.deepEqual(
      stats.newest.map((school) => school.id),
      [schools[3]?.id, schools[2]?.id, schools[1]?.id],
    );
  });

  it("counts a legacy live insert as active", () => {
    const live = tenant({
      index: 1,
      status: "active",
      created: "2026-09-06T12:00:00.000Z",
    });
    const stats = recordSchoolCreated(emptyDashboardStats(now), live, now);
    assert.equal(stats.schoolCount, 1);
    assert.equal(stats.activeCount, 1);
    assert.equal(stats.pendingSetupCount, 0);
  });
});

describe("recordStatusChange", () => {
  it("moves a school between buckets and updates newest when present", () => {
    const pending = tenant({
      index: 1,
      status: "pending_setup",
      created: "2026-09-06T12:00:00.000Z",
    });
    let stats = recordSchoolCreated(emptyDashboardStats(now), pending, now);

    const claimed = { ...pending, slug: "school-1", status: "active" as const };
    stats = recordStatusChange(stats, claimed, "pending_setup", now);

    assert.equal(stats.pendingSetupCount, 0);
    assert.equal(stats.activeCount, 1);
    assert.equal(stats.schoolCount, 1);
    assert.equal(stats.newest[0]?.status, "active");
    assert.equal(stats.newest[0]?.slug, "school-1");

    const suspended = { ...claimed, status: "suspended" as const };
    stats = recordStatusChange(stats, suspended, "active", now);
    assert.equal(stats.activeCount, 0);
    assert.equal(stats.suspendedCount, 1);
    assert.equal(stats.newest[0]?.status, "suspended");

    stats = recordStatusChange(stats, claimed, "suspended", now);
    assert.equal(stats.suspendedCount, 0);
    assert.equal(stats.activeCount, 1);
  });

  it("does not shift counts when the status is unchanged", () => {
    const live = tenant({
      index: 1,
      status: "active",
      created: "2026-09-06T12:00:00.000Z",
    });
    const created = recordSchoolCreated(emptyDashboardStats(now), live, now);
    const same = recordStatusChange(created, live, "active", now);
    assert.equal(same.activeCount, 1);
    assert.equal(same.schoolCount, 1);
  });
});
