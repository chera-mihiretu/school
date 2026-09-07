import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCampusDirectorNavActive } from "./campus-director-nav.ts";

describe("isCampusDirectorNavActive", () => {
  it("matches dashboard and teachers list exactly", () => {
    assert.equal(isCampusDirectorNavActive("/dashboard", "/dashboard"), true);
    assert.equal(isCampusDirectorNavActive("/teachers", "/teachers"), true);
    assert.equal(isCampusDirectorNavActive("/teachers/new", "/teachers"), false);
    assert.equal(isCampusDirectorNavActive("/teachers", "/dashboard"), false);
    assert.equal(isCampusDirectorNavActive("/dashboard", "/teachers"), false);
    assert.equal(isCampusDirectorNavActive("/staff", "/staff"), true);
    assert.equal(isCampusDirectorNavActive("/staff", "/teachers"), false);
    assert.equal(isCampusDirectorNavActive("/teachers", "/staff"), false);
    assert.equal(isCampusDirectorNavActive("/settings", "/settings"), true);
    assert.equal(isCampusDirectorNavActive("/settings", "/dashboard"), false);
    assert.equal(isCampusDirectorNavActive("/login", "/dashboard"), false);
  });
});
