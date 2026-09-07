import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAppHost, isPlatformAdminHost } from "./host.ts";
import {
  createPublicUrl,
  publicUrl,
  readPublicUrlParts,
  rootHostFromAppHost,
} from "./public-url.ts";

const parts = { protocol: "http", host: "e-school.et:3000" };

describe("publicUrl", () => {
  it("composes first-login on the app label", () => {
    assert.equal(
      publicUrl(
        {
          label: "app",
          path: `/first-login?email=${encodeURIComponent("head@north-hall.et")}`,
        },
        parts,
      ),
      "http://app.e-school.et:3000/first-login?email=head%40north-hall.et",
    );
  });

  it("composes the admin origin", () => {
    assert.equal(publicUrl({ label: "admin" }, parts), "http://admin.e-school.et:3000");
  });

  it("composes a campus origin from a slug", () => {
    assert.equal(
      publicUrl({ label: "north-hall" }, parts),
      "http://north-hall.e-school.et:3000",
    );
  });

  it("composes the apex without a label", () => {
    assert.equal(createPublicUrl(parts)(), "http://e-school.et:3000");
  });

  it("does not treat production NODE_ENV as HTTPS", () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      assert.equal(
        publicUrl({ label: "north-hall" }, parts),
        "http://north-hall.e-school.et:3000",
      );
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});

describe("readPublicUrlParts", () => {
  it("defaults a missing public port to 3000", () => {
    const loaded = readPublicUrlParts({
      APP_PROTOCOL: "http",
      APP_HOST: "e-school.et",
    });
    assert.equal(loaded.host, "e-school.et:3000");
    assert.equal(rootHostFromAppHost(loaded.host), "e-school.et");
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
