import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isReservedSchoolSlug,
  normalizeSchoolSlug,
  tenantSchemaName,
  validateSchoolSlug,
} from "./school-slug.ts";

describe("normalizeSchoolSlug", () => {
  it("trims and lowercases the username", () => {
    assert.equal(normalizeSchoolSlug("  North-Hall  "), "north-hall");
  });
});

describe("isReservedSchoolSlug", () => {
  it("rejects platform labels used as school usernames", () => {
    for (const slug of ["www", "api", "app", "admin", "mail", "ftp", "ADMIN"]) {
      assert.equal(isReservedSchoolSlug(slug), true);
    }
    assert.equal(isReservedSchoolSlug("north-hall"), false);
  });
});

describe("validateSchoolSlug", () => {
  it("rejects reserved slugs after normalize", () => {
    assert.match(validateSchoolSlug("Admin") ?? "", /reserved/);
  });
});

describe("tenantSchemaName", () => {
  it("prefixes tenant_ and turns hyphens into underscores", () => {
    assert.equal(tenantSchemaName("north-hall"), "tenant_north_hall");
    assert.equal(tenantSchemaName("demo"), "tenant_demo");
  });
});
