import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadDatabaseSettings } from "./database-url.ts";

describe("loadDatabaseSettings", () => {
  it("reads a local docker URL without SSL", () => {
    const settings = loadDatabaseSettings({
      DATABASE_URL: "postgresql://school:school@postgres:5432/school",
    });

    assert.equal(settings.ssl, "disable");
    assert.equal(settings.prepare, true);
  });

  it("turns on SSL from sslmode=require in the URL", () => {
    const settings = loadDatabaseSettings({
      DATABASE_URL:
        "postgresql://user:pass@ep-example.neon.tech/neondb?sslmode=require",
    });

    assert.equal(settings.ssl, "require");
    assert.equal(settings.prepare, true);
  });

  it("disables prepared statements for the Supabase transaction pooler", () => {
    const settings = loadDatabaseSettings({
      DATABASE_URL:
        "postgresql://postgres.project:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require",
    });

    assert.equal(settings.ssl, "require");
    assert.equal(settings.prepare, false);
  });

  it("lets DATABASE_SSL override the URL and ignores an empty override", () => {
    const disabled = loadDatabaseSettings({
      DATABASE_URL:
        "postgresql://user:pass@db.example.com:5432/school?sslmode=require",
      DATABASE_SSL: "disable",
    });
    assert.equal(disabled.ssl, "disable");

    const fromUrl = loadDatabaseSettings({
      DATABASE_URL:
        "postgresql://user:pass@db.example.com:5432/school?sslmode=require",
      DATABASE_SSL: "",
    });
    assert.equal(fromUrl.ssl, "require");
  });

  it("rejects a missing or non-postgres URL", () => {
    assert.throws(() => loadDatabaseSettings({}), /DATABASE_URL is required/);
    assert.throws(
      () => loadDatabaseSettings({ DATABASE_URL: "https://example.com" }),
      /postgres/,
    );
  });
});
