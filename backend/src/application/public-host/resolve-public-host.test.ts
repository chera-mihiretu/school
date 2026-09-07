import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TenantDirectoryPort } from "../../domain/ports/tenant-directory-port.ts";
import { createEmptyTenantDirectory } from "./empty-tenant-directory.ts";
import { createResolvePublicHost } from "./resolve-public-host.ts";

const schools: TenantDirectoryPort = {
  async findBySlug(slug) {
    if (slug === "north-hall") {
      return {
        name: "North Hall",
        slug: "north-hall",
        status: "active",
        founded: "Founded 1908",
      };
    }
    if (slug === "river-oak") {
      return {
        name: "River Oak Day School",
        slug: "river-oak",
        status: "suspended",
        founded: "Founded 1974",
      };
    }
    return undefined;
  },
};

describe("createResolvePublicHost", () => {
  const resolve = createResolvePublicHost({
    rootHost: "e-school.et",
    tenants: schools,
  });

  it("returns the network home on the apex", async () => {
    const view = await resolve("e-school.et:3000");
    assert.equal(view.kind, "apex");
    assert.equal(view.host, "e-school.et");
  });

  it("returns the operator landing on the admin host", async () => {
    const view = await resolve("admin.e-school.et:3000");
    assert.equal(view.kind, "admin");
    if (view.kind === "admin") {
      assert.equal(view.host, "admin.e-school.et");
      assert.equal(view.rootHost, "e-school.et");
    }
  });

  it("returns a campus for an active tenant slug", async () => {
    const view = await resolve("north-hall.e-school.et:3000");
    assert.equal(view.kind, "campus");
    if (view.kind === "campus") {
      assert.equal(view.name, "North Hall");
      assert.equal(view.monogram, "NH");
    }
  });

  it("returns suspended for a paused tenant", async () => {
    const view = await resolve("river-oak.e-school.et");
    assert.equal(view.kind, "suspended");
  });

  it("returns unknown when the slug is not a tenant", async () => {
    const view = await resolve("maple-ridge.e-school.et");
    assert.equal(view.kind, "unknown");
  });

  it("does not treat admin as a school tenant", async () => {
    const empty = createResolvePublicHost({
      rootHost: "e-school.et",
      tenants: createEmptyTenantDirectory(),
    });
    const view = await empty("admin.e-school.et:3000");
    assert.equal(view.kind, "admin");
  });

  it("returns the public app host before reserved-slug unknown", async () => {
    const view = await resolve("app.e-school.et:3000");
    assert.equal(view.kind, "app");
    if (view.kind === "app") {
      assert.equal(view.host, "app.e-school.et");
      assert.equal(view.rootHost, "e-school.et");
    }
  });

  it("does not treat app as a school tenant", async () => {
    const withAppTenant: TenantDirectoryPort = {
      async findBySlug(slug) {
        if (slug === "app") {
          return {
            name: "App Campus",
            slug: "app",
            status: "active",
            founded: "Founded 2026",
          };
        }
        return undefined;
      },
    };
    const resolveApp = createResolvePublicHost({
      rootHost: "e-school.et",
      tenants: withAppTenant,
    });
    const view = await resolveApp("app.e-school.et:3000");
    assert.equal(view.kind, "app");
  });
});
