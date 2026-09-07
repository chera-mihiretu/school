import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emailsEqual,
  normalizeTenantEmail,
  TENANT_EMAIL_UNAVAILABLE,
  validateTenantEmail,
} from "./tenant.ts";

describe("validateTenantEmail", () => {
  it("normalizes and accepts a valid address", () => {
    assert.equal(normalizeTenantEmail("  Head@North-Hall.et "), "head@north-hall.et");
    assert.equal(validateTenantEmail("Head@North-Hall.et"), undefined);
  });

  it("rejects missing and invalid addresses", () => {
    assert.match(validateTenantEmail("   ") ?? "", /required/);
    assert.match(validateTenantEmail("not-an-email") ?? "", /valid email/);
  });
});

describe("emailsEqual", () => {
  it("ignores case and surrounding whitespace", () => {
    assert.equal(emailsEqual("  Admin@E-School.et ", "admin@e-school.et"), true);
    assert.equal(emailsEqual("head@north-hall.et", "other@north-hall.et"), false);
  });
});

describe("TENANT_EMAIL_UNAVAILABLE", () => {
  it("does not mention admin or the operator console", () => {
    assert.equal(TENANT_EMAIL_UNAVAILABLE, "This email cannot be used.");
    assert.doesNotMatch(TENANT_EMAIL_UNAVAILABLE, /admin|operator|console/i);
  });
});
