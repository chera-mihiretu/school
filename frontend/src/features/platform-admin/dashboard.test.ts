import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  displayDashboardDate,
  EMPTY_ADMIN_DASHBOARD,
  parseAdminDashboardStats,
} from "./dashboard.ts";

describe("parseAdminDashboardStats", () => {
  it("parses counters, year buckets, and newest schools", () => {
    const stats = parseAdminDashboardStats({
      schoolCount: 3,
      activeCount: 1,
      pendingSetupCount: 1,
      suspendedCount: 1,
      servingPercent: 33,
      createdByYear: { "2026": 3 },
      newest: [
        {
          id: "11111111-1111-1111-1111-111111111111",
          name: "North Hall",
          slug: "north-hall",
          email: "head@north-hall.et",
          status: "active",
          created: "2026-09-07T12:00:00.000Z",
        },
      ],
    });

    assert.equal(stats.schoolCount, 3);
    assert.equal(stats.activeCount, 1);
    assert.equal(stats.pendingSetupCount, 1);
    assert.equal(stats.suspendedCount, 1);
    assert.equal(stats.servingPercent, 33);
    assert.deepEqual(stats.createdByYear, { "2026": 3 });
    assert.equal(stats.newest[0]?.name, "North Hall");
    assert.equal(stats.newest[0]?.slug, "north-hall");
  });

  it("falls back to empty zeros for a bad body", () => {
    assert.deepEqual(parseAdminDashboardStats(null), EMPTY_ADMIN_DASHBOARD);
    assert.deepEqual(parseAdminDashboardStats({ schoolCount: -2 }), {
      ...EMPTY_ADMIN_DASHBOARD,
    });
  });
});

describe("displayDashboardDate", () => {
  it("shows the ISO calendar day", () => {
    assert.equal(displayDashboardDate("2026-09-07T12:00:00.000Z"), "2026-09-07");
    assert.equal(displayDashboardDate("2026-09-07"), "2026-09-07");
  });
});
