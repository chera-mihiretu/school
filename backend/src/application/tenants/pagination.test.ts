import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizePage, normalizePageSize } from "./pagination.ts";

describe("tenant pagination bounds", () => {
  it("defaults page to 1 and pageSize to 10", () => {
    assert.equal(normalizePage(undefined), 1);
    assert.equal(normalizePage(""), 1);
    assert.equal(normalizePage("nope"), 1);
    assert.equal(normalizePageSize(undefined), 10);
    assert.equal(normalizePageSize(""), 10);
    assert.equal(normalizePageSize("nope"), 10);
  });

  it("clamps page and pageSize to the allowed range", () => {
    assert.equal(normalizePage(0), 1);
    assert.equal(normalizePage(-4), 1);
    assert.equal(normalizePage("3"), 3);
    assert.equal(normalizePageSize(0), 1);
    assert.equal(normalizePageSize(-2), 1);
    assert.equal(normalizePageSize(100), 50);
    assert.equal(normalizePageSize("25"), 25);
  });
});
