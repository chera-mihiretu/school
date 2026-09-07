import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tenantSchemaName } from "../../domain/school-slug.ts";
import { createMemoryTeacherStore } from "./memory-teacher-store.ts";

const profile = {
  givenName: "Abebe",
  fatherName: "Bekele",
  grandfatherName: "Tesfaye",
  sex: "male" as const,
  phone: "+251912345678",
  email: "abebe@north-hall.et",
  employeeId: null,
  passwordHash: "hash:temp",
};

describe("createMemoryTeacherStore", () => {
  it("keeps teachers isolated by campus slug / tenant schema", async () => {
    const store = createMemoryTeacherStore();
    const inserted = await store.insert("north-hall", profile);
    assert.equal(inserted.ok, true);

    assert.equal(tenantSchemaName("north-hall"), "tenant_north_hall");
    assert.equal(tenantSchemaName("east-yard"), "tenant_east_yard");
    assert.notEqual(
      tenantSchemaName("north-hall"),
      tenantSchemaName("east-yard"),
    );

    assert.equal(
      await store.findByEmail("east-yard", "abebe@north-hall.et"),
      undefined,
    );
    assert.deepEqual(await store.listNewestFirst("east-yard"), []);
    const found = await store.findByEmail("north-hall", "Abebe@North-Hall.et");
    assert.equal(found?.email, "abebe@north-hall.et");
  });
});
