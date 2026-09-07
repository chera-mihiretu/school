import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createGetHealth } from "./get-health.ts";

describe("createGetHealth", () => {
  it("reports the database as up when ping succeeds", async () => {
    const getHealth = createGetHealth("backend-service", {
      ping: async () => undefined,
      close: async () => undefined,
    });

    assert.deepEqual(await getHealth(), {
      ok: true,
      service: "backend-service",
      database: "up",
    });
  });

  it("reports the database as down when ping fails", async () => {
    const getHealth = createGetHealth("backend-service", {
      ping: async () => {
        throw new Error("connection refused");
      },
      close: async () => undefined,
    });

    assert.deepEqual(await getHealth(), {
      ok: false,
      service: "backend-service",
      database: "down",
    });
  });
});
