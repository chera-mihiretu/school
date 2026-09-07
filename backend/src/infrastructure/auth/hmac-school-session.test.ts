import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createHmacSessionSigner } from "./hmac-session.ts";
import { createHmacSchoolSessionSigner } from "./hmac-school-session.ts";

const secret = "a-very-long-session-secret-value";

describe("createHmacSchoolSessionSigner", () => {
  it("round-trips a school session and rejects a tampered token", () => {
    const sessions = createHmacSchoolSessionSigner({
      secret,
      ttlSeconds: 60,
      now: () => new Date("2026-09-06T00:00:00.000Z"),
    });

    const issued = sessions.issue({
      accountId: "11111111-1111-1111-1111-111111111111",
      email: "head@north-hall.et",
    });
    const claims = sessions.read(issued.token);
    assert.ok(claims);
    assert.equal(claims.accountId, "11111111-1111-1111-1111-111111111111");
    assert.equal(claims.email, "head@north-hall.et");
    assert.equal(claims.kind, undefined);
    assert.equal(sessions.read(`${issued.token}x`), undefined);
  });

  it("stores a teacher kind and leaves a missing kind unset", () => {
    const sessions = createHmacSchoolSessionSigner({
      secret,
      ttlSeconds: 60,
      now: () => new Date("2026-09-06T00:00:00.000Z"),
    });

    const teacher = sessions.issue({
      accountId: "22222222-2222-2222-2222-222222222222",
      email: "abebe@north-hall.et",
      kind: "teacher",
    });
    const teacherClaims = sessions.read(teacher.token);
    assert.ok(teacherClaims);
    assert.equal(teacherClaims.kind, "teacher");

    const legacy = sessions.issue({
      accountId: "11111111-1111-1111-1111-111111111111",
      email: "head@north-hall.et",
    });
    const legacyClaims = sessions.read(legacy.token);
    assert.ok(legacyClaims);
    assert.equal(legacyClaims.kind, undefined);
  });

  it("rejects an admin session signed with the same raw secret", () => {
    const admin = createHmacSessionSigner({
      secret,
      ttlSeconds: 60,
      now: () => new Date("2026-09-06T00:00:00.000Z"),
    });
    const school = createHmacSchoolSessionSigner({
      secret,
      ttlSeconds: 60,
      now: () => new Date("2026-09-06T00:00:00.000Z"),
    });

    const issued = admin.issue("admin@e-school.et");
    assert.equal(school.read(issued.token), undefined);
  });

  it("rejects an expired token", () => {
    let now = new Date("2026-09-06T00:00:00.000Z");
    const sessions = createHmacSchoolSessionSigner({
      secret,
      ttlSeconds: 60,
      now: () => now,
    });

    const issued = sessions.issue({
      accountId: "11111111-1111-1111-1111-111111111111",
      email: "head@north-hall.et",
    });
    now = new Date("2026-09-06T00:02:00.000Z");
    assert.equal(sessions.read(issued.token), undefined);
  });
});
