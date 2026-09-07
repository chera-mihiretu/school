import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readCampusLoginIdentifier } from "./login-identifier.ts";

describe("readCampusLoginIdentifier", () => {
  it("reads an email", () => {
    assert.deepEqual(readCampusLoginIdentifier(" Abebe@North-Hall.et "), {
      kind: "email",
      email: "abebe@north-hall.et",
    });
  });

  it("reads a printed teacher or student ID", () => {
    assert.deepEqual(readCampusLoginIdentifier("aaat/00001/26"), {
      kind: "school_id",
      schoolId: "AAAT/00001/26",
      role: "T",
    });
    assert.deepEqual(readCampusLoginIdentifier(" AAA S / 00001 / 26 "), {
      kind: "school_id",
      schoolId: "AAAS/00001/26",
      role: "S",
    });
    assert.deepEqual(readCampusLoginIdentifier("aaaf/00001/26"), {
      kind: "school_id",
      schoolId: "AAAF/00001/26",
      role: "F",
    });
  });

  it("treats other non-email text as a school ID lookup key", () => {
    assert.deepEqual(readCampusLoginIdentifier("T-12"), {
      kind: "school_id",
      schoolId: "T-12",
      role: undefined,
    });
  });

  it("rejects a blank value", () => {
    assert.equal(readCampusLoginIdentifier("  "), undefined);
  });
});
