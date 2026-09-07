import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ABBREVIATION_LOOKUP_DEBOUNCE_MS,
  SCHOOL_ACCOUNT_SESSION_COOKIE,
  USERNAME_LOOKUP_DEBOUNCE_MS,
} from "./constants.ts";

describe("SCHOOL_ACCOUNT_SESSION_COOKIE", () => {
  it("is school_account_session, not the admin cookie", () => {
    assert.equal(SCHOOL_ACCOUNT_SESSION_COOKIE, "school_account_session");
    assert.notEqual(SCHOOL_ACCOUNT_SESSION_COOKIE, "platform_admin_session");
  });
});

describe("USERNAME_LOOKUP_DEBOUNCE_MS", () => {
  it("debounces username lookup at 380ms", () => {
    assert.equal(USERNAME_LOOKUP_DEBOUNCE_MS, 380);
  });
});

describe("ABBREVIATION_LOOKUP_DEBOUNCE_MS", () => {
  it("debounces abbreviation lookup at 380ms", () => {
    assert.equal(ABBREVIATION_LOOKUP_DEBOUNCE_MS, 380);
  });
});
