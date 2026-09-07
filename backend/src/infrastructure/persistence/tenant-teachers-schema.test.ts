import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import postgres from "postgres";
import {
  tenantIdCountersRelation,
  tenantStaffRelation,
  tenantTeachersRelation,
} from "./tenant-teachers-schema.ts";

describe("tenantTeachersRelation", () => {
  const sql = postgres({ max: 1, fetch_types: false });

  after(async () => {
    await sql.end({ timeout: 0 });
  });

  it("qualifies schema.table as one postgres.js identifier", () => {
    const teachers = tenantTeachersRelation(sql, "tenant_abdilemi");
    assert.equal(
      "value" in teachers ? teachers.value : undefined,
      '"tenant_abdilemi"."teachers"',
    );
    const counters = tenantIdCountersRelation(sql, "tenant_abdilemi");
    assert.equal(
      "value" in counters ? counters.value : undefined,
      '"tenant_abdilemi"."id_counters"',
    );
    const staff = tenantStaffRelation(sql, "tenant_abdilemi");
    assert.equal(
      "value" in staff ? staff.value : undefined,
      '"tenant_abdilemi"."staff"',
    );
  });
});
