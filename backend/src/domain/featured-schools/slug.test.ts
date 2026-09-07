import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isReservedSchoolSlug,
  isValidSchoolSlug,
  validateFeaturedSchoolName,
  validateFeaturedSchoolSlug,
} from "./slug.ts";

describe("isValidSchoolSlug", () => {
  it("accepts labels that start and end with a letter or number", () => {
    assert.equal(isValidSchoolSlug("north-hall"), true);
    assert.equal(isValidSchoolSlug("a"), true);
    assert.equal(isValidSchoolSlug("-north"), false);
    assert.equal(isValidSchoolSlug("North"), false);
  });
});

describe("isReservedSchoolSlug", () => {
  it("rejects platform labels", () => {
    for (const slug of ["admin", "www", "api", "app", "mail", "ftp"]) {
      assert.equal(isReservedSchoolSlug(slug), true);
    }
    assert.equal(isReservedSchoolSlug("north-hall"), false);
  });
});

describe("validateFeaturedSchoolSlug", () => {
  it("accepts a normal campus slug", () => {
    assert.equal(validateFeaturedSchoolSlug("north-hall"), undefined);
  });

  it("rejects empty, invalid, and reserved slugs", () => {
    assert.match(validateFeaturedSchoolSlug("  ") ?? "", /required/);
    assert.match(validateFeaturedSchoolSlug("-north") ?? "", /Invalid slug/);
    assert.match(validateFeaturedSchoolSlug("admin") ?? "", /reserved/);
  });
});

describe("validateFeaturedSchoolName", () => {
  it("requires a trimmed name", () => {
    assert.equal(validateFeaturedSchoolName("North Hall"), undefined);
    assert.match(validateFeaturedSchoolName("   ") ?? "", /required/);
  });
});
