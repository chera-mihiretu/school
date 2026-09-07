import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAppHost, isPlatformAdminHost } from "./host.ts";

describe("isPlatformAdminHost", () => {
  it("accepts the admin host with a port", () => {
    assert.equal(isPlatformAdminHost("admin.e-school.et:3000", "e-school.et"), true);
  });

  it("rejects apex and school tenants", () => {
    assert.equal(isPlatformAdminHost("e-school.et:3000", "e-school.et"), false);
    assert.equal(isPlatformAdminHost("demo.e-school.et", "e-school.et"), false);
  });
});

describe("isAppHost", () => {
  it("accepts the app host with a port", () => {
    assert.equal(isAppHost("app.e-school.et:3000", "e-school.et"), true);
  });

  it("rejects apex, admin, and school tenants", () => {
    assert.equal(isAppHost("e-school.et:3000", "e-school.et"), false);
    assert.equal(isAppHost("admin.e-school.et", "e-school.et"), false);
    assert.equal(isAppHost("demo.e-school.et", "e-school.et"), false);
  });
});
