import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tenantSchemaName } from "../../domain/school-slug.ts";
import { createMemoryStaffStore } from "./memory-staff-store.ts";

const profile = {
  givenName: "Hana",
  fatherName: "Bekele",
  grandfatherName: "Tessema",
  sex: "female" as const,
  phone: "+251911223344",
  email: "hana@north-hall.et",
  employeeId: null,
  passwordHash: "hash:temp",
};

describe("createMemoryStaffStore", () => {
  it("keeps staff isolated by campus slug / tenant schema", async () => {
    const store = createMemoryStaffStore();
    const inserted = await store.insert("north-hall", profile);
    assert.equal(inserted.ok, true);

    assert.equal(tenantSchemaName("north-hall"), "tenant_north_hall");
    assert.equal(tenantSchemaName("east-yard"), "tenant_east_yard");
    assert.notEqual(
      tenantSchemaName("north-hall"),
      tenantSchemaName("east-yard"),
    );

    assert.equal(
      await store.findByEmail("east-yard", "hana@north-hall.et"),
      undefined,
    );
    assert.deepEqual(await store.listNewestFirst("east-yard"), []);
    const found = await store.findByEmail("north-hall", "Hana@North-Hall.et");
    assert.equal(found?.email, "hana@north-hall.et");
  });
});
