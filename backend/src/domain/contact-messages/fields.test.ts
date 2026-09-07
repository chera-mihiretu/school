import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeContactEmail,
  validateContactEmail,
  validateContactName,
  validateContactSchool,
} from "./fields.ts";

describe("contact message fields", () => {
  it("normalizes email and rejects invalid values", () => {
    assert.equal(normalizeContactEmail(" Ada@School.ET "), "ada@school.et");
    assert.equal(validateContactEmail("ada@school.et"), undefined);
    assert.match(validateContactEmail("") ?? "", /required/);
    assert.match(validateContactEmail("not-an-email") ?? "", /valid email/);
  });

  it("requires school and name", () => {
    assert.equal(validateContactSchool("North Hall"), undefined);
    assert.match(validateContactSchool("") ?? "", /School name/);
    assert.match(validateContactName("") ?? "", /Name/);
  });
});
