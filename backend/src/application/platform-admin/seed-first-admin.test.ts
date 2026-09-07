import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSeedFirstAdmin } from "./seed-first-admin.ts";

describe("createSeedFirstAdmin", () => {
  it("hashes and inserts when the store is empty", async () => {
    const calls: Array<{ email: string; passwordHash: string }> = [];
    const seed = createSeedFirstAdmin({
      store: {
        ensureSchema: async () => undefined,
        insertFirstAdmin: async (input) => {
          calls.push(input);
          return "created";
        },
        findPasswordHashByEmail: async () => undefined,
      },
      hasher: {
        hash: async (password) => `hash:${password}`,
        verify: async () => false,
      },
    });

    const result = await seed({
      email: "Admin@e-school.et",
      password: "iLueEHYm5N",
    });

    assert.deepEqual(result, {
      ok: true,
      status: "created",
      email: "admin@e-school.et",
    });
    assert.deepEqual(calls, [
      { email: "admin@e-school.et", passwordHash: "hash:iLueEHYm5N" },
    ]);
  });

  it("skips when an admin already exists and rejects a short password", async () => {
    const seed = createSeedFirstAdmin({
      store: {
        ensureSchema: async () => undefined,
        insertFirstAdmin: async () => "exists",
        findPasswordHashByEmail: async () => undefined,
      },
      hasher: {
        hash: async () => "hash",
        verify: async () => false,
      },
    });

    const skipped = await seed({
      email: "admin@e-school.et",
      password: "iLueEHYm5N",
    });
    assert.deepEqual(skipped, { ok: true, status: "skipped" });

    const invalid = await seed({
      email: "admin@e-school.et",
      password: "short",
    });
    assert.equal(invalid.ok, false);
    if (!invalid.ok) {
      assert.match(invalid.error, /at least 10/);
    }
  });
});
