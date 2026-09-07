import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createHmacSessionSigner } from "./hmac-session.ts";

describe("createHmacSessionSigner", () => {
  it("round-trips a token and rejects a tampered one", () => {
    const sessions = createHmacSessionSigner({
      secret: "a-very-long-session-secret-value",
      ttlSeconds: 60,
      now: () => new Date("2026-09-05T00:00:00.000Z"),
    });

    const issued = sessions.issue("admin@e-school.et");
    const claims = sessions.read(issued.token);
    assert.ok(claims);
    assert.equal(claims.email, "admin@e-school.et");
    assert.equal(sessions.read(`${issued.token}x`), undefined);
  });

  it("rejects an expired token", () => {
    let now = new Date("2026-09-05T00:00:00.000Z");
    const sessions = createHmacSessionSigner({
      secret: "a-very-long-session-secret-value",
      ttlSeconds: 60,
      now: () => now,
    });

    const issued = sessions.issue("admin@e-school.et");
    now = new Date("2026-09-05T00:02:00.000Z");
    assert.equal(sessions.read(issued.token), undefined);
  });
});

