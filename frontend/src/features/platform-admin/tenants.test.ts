import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canResendTenantCredentials,
  DIRECTOR_EMAIL_UNAVAILABLE,
  parseTenantSchool,
  tenantMailStatusCopy,
  validateDirectorEmail,
} from "./tenants.ts";

describe("validateDirectorEmail", () => {
  it("requires a valid address and uses the same unavailable copy as the API", () => {
    assert.equal(validateDirectorEmail("  Head@North-Hall.et "), undefined);
    assert.equal(validateDirectorEmail("   "), "Email is required.");
    assert.equal(validateDirectorEmail("not-an-email"), "A valid email is required.");
    assert.equal(DIRECTOR_EMAIL_UNAVAILABLE, "This email cannot be used.");
    assert.doesNotMatch(DIRECTOR_EMAIL_UNAVAILABLE, /admin|operator|console/i);
  });
});

describe("parseTenantSchool", () => {
  it("parses mail fields and defaults missing ones to null", () => {
    const school = parseTenantSchool({
      id: "11111111-1111-1111-1111-111111111111",
      name: "North Hall",
      status: "pending_setup",
      lastMailAt: "2026-09-07T08:00:00.000Z",
      lastMailOk: true,
      lastMailError: null,
      signedInAt: null,
    });
    assert.ok(school);
    assert.equal(school.lastMailAt, "2026-09-07T08:00:00.000Z");
    assert.equal(school.lastMailOk, true);
    assert.equal(school.lastMailError, null);
    assert.equal(school.signedInAt, null);

    const legacy = parseTenantSchool({
      id: 12,
      name: "East Yard",
      status: "active",
    });
    assert.ok(legacy);
    assert.equal(legacy.lastMailAt, null);
    assert.equal(legacy.lastMailOk, null);
    assert.equal(legacy.lastMailError, null);
    assert.equal(legacy.signedInAt, null);
  });
});

describe("canResendTenantCredentials", () => {
  it("matches the API: unclaimed username and not suspended", () => {
    assert.equal(
      canResendTenantCredentials({ slug: null, status: "pending_setup" }),
      true,
    );
    assert.equal(
      canResendTenantCredentials({ slug: null, status: "active" }),
      true,
    );
    assert.equal(
      canResendTenantCredentials({ slug: null, status: "suspended" }),
      false,
    );
    assert.equal(
      canResendTenantCredentials({ slug: "north-hall", status: "pending_setup" }),
      false,
    );
    assert.equal(
      canResendTenantCredentials({ slug: "north-hall", status: "active" }),
      false,
    );
  });
});

describe("tenantMailStatusCopy", () => {
  it("is honest about SMTP accept versus director sign-in", () => {
    assert.equal(
      tenantMailStatusCopy({
        signedInAt: "2026-09-07T09:00:00.000Z",
        lastMailOk: true,
        lastMailError: null,
      }),
      "Director signed in",
    );
    assert.equal(
      tenantMailStatusCopy({
        signedInAt: null,
        lastMailOk: true,
        lastMailError: null,
      }),
      "SMTP accepted — not proof of inbox",
    );
    assert.equal(
      tenantMailStatusCopy({
        signedInAt: null,
        lastMailOk: false,
        lastMailError: "SMTP refused the message",
      }),
      "Send failed: SMTP refused the message",
    );
    assert.equal(
      tenantMailStatusCopy({
        signedInAt: null,
        lastMailOk: null,
        lastMailError: null,
      }),
      "Not sent",
    );
  });
});
