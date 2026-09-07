import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadAuthConfig } from "./auth-config.ts";
import { createPublicUrl } from "./public-url.ts";

const valid = {
  PLATFORM_ADMIN_EMAIL: "admin@e-school.et",
  PLATFORM_ADMIN_PASSWORD: "secret",
  SESSION_SECRET: "test-session-secret-value",
};

describe("loadAuthConfig", () => {
  it("derives rootHost from APP_HOST and keeps protocol plus public host", () => {
    const config = loadAuthConfig({
      ...valid,
      APP_PROTOCOL: "http",
      APP_HOST: "e-school.et:3000",
    });
    assert.equal(config.rootHost, "e-school.et");
    assert.equal(config.protocol, "http");
    assert.equal(config.publicHost, "e-school.et:3000");
    assert.equal(config.platformAdminEmail, "admin@e-school.et");
    assert.equal(config.sessionTtlSeconds, 28800);
  });

  it("adds :3000 when APP_HOST has no public port", () => {
    const config = loadAuthConfig({ ...valid, APP_HOST: "e-school.et" });
    assert.equal(config.rootHost, "e-school.et");
    assert.equal(config.publicHost, "e-school.et:3000");
  });

  it("does not switch the scheme when NODE_ENV is production", () => {
    const config = loadAuthConfig({
      ...valid,
      APP_PROTOCOL: "http",
      APP_HOST: "e-school.et:3000",
      NODE_ENV: "production",
      SESSION_SECRET: "production-session-secret-value-32ch",
    });
    const publicUrl = createPublicUrl({
      protocol: config.protocol,
      host: config.publicHost,
    });
    assert.equal(
      publicUrl({
        label: "app",
        path: `/first-login?email=${encodeURIComponent("user@example.com")}`,
      }),
      "http://app.e-school.et:3000/first-login?email=user%40example.com",
    );
  });

  it("rejects a short production secret", () => {
    assert.throws(
      () =>
        loadAuthConfig({
          ...valid,
          NODE_ENV: "production",
          SESSION_SECRET: "only-sixteen-chars",
        }),
      /at least 32 characters/,
    );
  });
});
