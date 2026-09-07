import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatTenantName,
  getRootHost,
  isAppHost,
  isPlatformAdminHost,
  isReservedSlug,
  parseSchoolHost,
  stripHostPort,
} from "./host.ts";

describe("stripHostPort", () => {
  it("drops a numeric port", () => {
    assert.equal(stripHostPort("E-School.et:3000"), "e-school.et");
  });
});

describe("getRootHost", () => {
  it("strips a public port from APP_HOST for Host matching", () => {
    const previous = process.env.APP_HOST;
    process.env.APP_HOST = "e-school.et:3000";
    try {
      assert.equal(getRootHost(), "e-school.et");
      assert.equal(isAppHost("app.e-school.et:3000"), true);
      assert.equal(isPlatformAdminHost("admin.e-school.et:3000"), true);
    } finally {
      if (previous === undefined) {
        delete process.env.APP_HOST;
      } else {
        process.env.APP_HOST = previous;
      }
    }
  });
});

describe("parseSchoolHost", () => {
  it("treats the apex and www as the root host", () => {
    assert.equal(parseSchoolHost("e-school.et:3000").subdomain, null);
    assert.equal(parseSchoolHost("www.e-school.et:3000").isApex, true);
  });

  it("extracts a single tenant label", () => {
    const parsed = parseSchoolHost("campus1.e-school.et:3000");
    assert.equal(parsed.subdomain, "campus1");
    assert.equal(parsed.isApex, false);
    assert.equal(parsed.rootHost, "e-school.et");
  });

  it("ignores reserved and nested labels", () => {
    assert.equal(parseSchoolHost("api.e-school.et").subdomain, null);
    assert.equal(parseSchoolHost("a.b.e-school.et").subdomain, null);
  });
});

describe("isPlatformAdminHost", () => {
  it("accepts only the admin host", () => {
    assert.equal(isPlatformAdminHost("admin.e-school.et:3000"), true);
    assert.equal(isPlatformAdminHost("e-school.et:3000"), false);
    assert.equal(isPlatformAdminHost("demo.e-school.et:3000"), false);
  });
});

describe("isAppHost", () => {
  it("accepts only the app host", () => {
    assert.equal(isAppHost("app.e-school.et:3000"), true);
    assert.equal(isAppHost("admin.e-school.et:3000"), false);
    assert.equal(isAppHost("e-school.et:3000"), false);
    assert.equal(isAppHost("demo.e-school.et:3000"), false);
  });
});

describe("isReservedSlug", () => {
  it("rejects reserved platform labels", () => {
    for (const slug of ["www", "api", "app", "admin", "mail", "ftp", "ADMIN"]) {
      assert.equal(isReservedSlug(slug), true);
    }
    assert.equal(isReservedSlug("north-hall"), false);
  });
});

describe("formatTenantName", () => {
  it("title-cases hyphenated slugs", () => {
    assert.equal(formatTenantName("campus1"), "Campus1");
    assert.equal(formatTenantName("north-hall"), "North Hall");
  });
});
