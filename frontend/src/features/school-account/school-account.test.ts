import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isCampusDirectorSession,
  parseCampusAccountKind,
  parseCampusSessionView,
  parseCampusSignInView,
} from "./school-account.ts";

describe("parseCampusAccountKind", () => {
  it("accepts director, teacher, and staff", () => {
    assert.equal(parseCampusAccountKind("director"), "director");
    assert.equal(parseCampusAccountKind("teacher"), "teacher");
    assert.equal(parseCampusAccountKind("staff"), "staff");
    assert.equal(parseCampusAccountKind("admin"), undefined);
    assert.equal(parseCampusAccountKind(undefined), undefined);
  });
});

describe("parseCampusSessionView", () => {
  const base = {
    accountId: "acct-1",
    email: "head@north-hall.et",
    expiresAt: "2026-09-07T12:00:00.000Z",
    slug: "north-hall",
    host: "north-hall.e-school.et",
  };

  it("rejects a missing kind and defaults mustChangePassword to false", () => {
    assert.equal(parseCampusSessionView(base), undefined);
    const session = parseCampusSessionView({ ...base, kind: "director" });
    assert.ok(session);
    assert.equal(session.kind, "director");
    assert.equal(session.mustChangePassword, false);
  });

  it("reads teacher kind and mustChangePassword", () => {
    const session = parseCampusSessionView({
      ...base,
      kind: "teacher",
      mustChangePassword: true,
    });
    assert.ok(session);
    assert.equal(session.kind, "teacher");
    assert.equal(session.mustChangePassword, true);
  });

  it("rejects a body without account fields", () => {
    assert.equal(parseCampusSessionView({ email: "x@y.z" }), undefined);
  });
});

describe("isCampusDirectorSession", () => {
  const director = {
    accountId: "acct-1",
    email: "head@north-hall.et",
    expiresAt: "2026-09-07T12:00:00.000Z",
    slug: "north-hall",
    host: "north-hall.e-school.et",
    kind: "director" as const,
    mustChangePassword: false,
  };

  it("allows only a director campus session", () => {
    assert.equal(isCampusDirectorSession(director), true);
    assert.equal(isCampusDirectorSession({ ...director, kind: "teacher" }), false);
    assert.equal(isCampusDirectorSession({ ...director, kind: "staff" }), false);
    assert.equal(isCampusDirectorSession(undefined), false);
  });
});

describe("parseCampusSignInView", () => {
  it("requires a token", () => {
    assert.equal(
      parseCampusSignInView({
        accountId: "acct-1",
        email: "head@north-hall.et",
        expiresAt: "2026-09-07T12:00:00.000Z",
        slug: "north-hall",
        host: "north-hall.e-school.et",
        kind: "director",
        mustChangePassword: false,
      }),
      undefined,
    );
    const signedIn = parseCampusSignInView({
      accountId: "acct-1",
      email: "head@north-hall.et",
      expiresAt: "2026-09-07T12:00:00.000Z",
      slug: "north-hall",
      host: "north-hall.e-school.et",
      kind: "director",
      mustChangePassword: false,
      token: "sess-token",
    });
    assert.ok(signedIn);
    assert.equal(signedIn.token, "sess-token");
  });
});
