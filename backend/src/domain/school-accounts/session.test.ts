import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { schoolAccountNextStep, toSchoolSessionView } from "./session.ts";

describe("schoolAccountNextStep", () => {
  it("is password until the flag is cleared", () => {
    assert.equal(
      schoolAccountNextStep({
        mustChangePassword: true,
        slug: null,
        abbreviation: null,
      }),
      "password",
    );
    assert.equal(
      schoolAccountNextStep({
        mustChangePassword: false,
        slug: null,
        abbreviation: null,
      }),
      "username",
    );
  });

  it("is abbreviation after the slug and before the code is saved", () => {
    assert.equal(
      schoolAccountNextStep({
        mustChangePassword: false,
        slug: "north-hall",
        abbreviation: null,
      }),
      "abbreviation",
    );
  });
});

describe("toSchoolSessionView", () => {
  it("serializes claims and the next step", () => {
    assert.deepEqual(
      toSchoolSessionView({
        accountId: "11111111-1111-1111-1111-111111111111",
        email: "head@north-hall.et",
        expiresAt: new Date("2026-09-06T12:00:00.000Z"),
        mustChangePassword: true,
        slug: null,
        abbreviation: null,
      }),
      {
        accountId: "11111111-1111-1111-1111-111111111111",
        email: "head@north-hall.et",
        expiresAt: "2026-09-06T12:00:00.000Z",
        mustChangePassword: true,
        nextStep: "password",
      },
    );
  });
});
