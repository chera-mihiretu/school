import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createArgon2PasswordHasher } from "./argon2-hasher.ts";

const testHasher = createArgon2PasswordHasher({
  memoryCostKiB: 8,
  timeCost: 1,
  parallelism: 1,
  hashLength: 32,
});

describe("createArgon2PasswordHasher", () => {
  it("round-trips a password and rejects a wrong one", async () => {
    const encoded = await testHasher.hash("a-sufficiently-long-secret");
    assert.match(encoded, /^\$argon2id\$v=19\$/);
    assert.equal(await testHasher.verify(encoded, "a-sufficiently-long-secret"), true);
    assert.equal(await testHasher.verify(encoded, "wrong-password"), false);
    assert.equal(await testHasher.verify("not-a-hash", "a-sufficiently-long-secret"), false);
  });
});
