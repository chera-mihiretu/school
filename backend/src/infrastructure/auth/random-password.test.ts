import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCryptoPasswordGenerator } from "./random-password.ts";

describe("createCryptoPasswordGenerator", () => {
  it("returns a password of at least 16 characters", () => {
    const generator = createCryptoPasswordGenerator();
    const first = generator.generate();
    const second = generator.generate();
    assert.ok(first.length >= 16);
    assert.ok(second.length >= 16);
    assert.notEqual(first, second);
    assert.match(first, /^[A-Za-z0-9]+$/);
  });
});
