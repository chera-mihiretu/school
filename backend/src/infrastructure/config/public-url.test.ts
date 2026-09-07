import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAppHost, isPlatformAdminHost } from "../../domain/platform-admin/host.ts";
import {
  createPublicUrl,
  loadPublicUrlParts,
  rootHostFromAppHost,
} from "./public-url.ts";

const parts = { protocol: "http", host: "e-school.et:3000" };

describe("createPublicUrl", () => {
  const publicUrl = createPublicUrl(parts);

  it("composes first-login on the app label", () => {
    const firstLoginUrl = publicUrl({
      label: "app",
      path: `/first-login?email=${encodeURIComponent("head@north-hall.et")}`,
    });
    assert.equal(
      firstLoginUrl,
      "http://app.e-school.et:3000/first-login?email=head%40north-hall.et",
    );
  });

  it("composes the admin origin", () => {
    assert.equal(publicUrl({ label: "admin" }), "http://admin.e-school.et:3000");
  });

  it("composes a campus origin from a slug", () => {
    assert.equal(
      publicUrl({ label: "north-hall" }),
      "http://north-hall.e-school.et:3000",
    );
  });

  it("composes the apex without a label", () => {
    assert.equal(publicUrl(), "http://e-school.et:3000");
  });
});

describe("loadPublicUrlParts", () => {
  it("defaults a missing public port to 3000", () => {
    const loaded = loadPublicUrlParts({
      APP_PROTOCOL: "http",
      APP_HOST: "e-school.et",
    });
    assert.equal(loaded.host, "e-school.et:3000");
    assert.equal(rootHostFromAppHost(loaded.host), "e-school.et");
  });

  it("keeps protocol and host with an explicit port", () => {
    const loaded = loadPublicUrlParts({
      APP_PROTOCOL: "http",
      APP_HOST: "e-school.et:3000",
    });
    assert.equal(loaded.protocol, "http");
    assert.equal(loaded.host, "e-school.et:3000");
    assert.equal(rootHostFromAppHost("e-school.et:3000"), "e-school.et");
  });
});

describe("host matching with a derived root", () => {
  it("matches app and admin Host headers against the DNS root", () => {
    const rootHost = rootHostFromAppHost("e-school.et:3000");
    assert.equal(rootHost, "e-school.et");
    assert.equal(isAppHost("app.e-school.et:3000", rootHost), true);
    assert.equal(isPlatformAdminHost("admin.e-school.et:3000", rootHost), true);
  });
});
