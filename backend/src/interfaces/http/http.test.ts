import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPathname } from "./http.ts";

describe("getPathname", () => {
  it("returns the request path", () => {
    const pathname = getPathname({
      headers: { host: "localhost:3000" },
      url: "/health?ready=1",
    });

    assert.equal(pathname, "/health");
  });

  it("defaults to root when the url is missing", () => {
    const pathname = getPathname({
      headers: { host: "localhost" },
    });

    assert.equal(pathname, "/");
  });
});
