import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateBootstrapAdmin } from "./credentials.ts";

describe("validateBootstrapAdmin", () => {
  it("accepts a valid email and long password", () => {
    assert.equal(
      validateBootstrapAdmin("Admin@e-school.et", "iLueEHYm5N"),
      undefined,
    );
  });

  it("rejects a short password and symbols", () => {
    assert.match(
      validateBootstrapAdmin("admin@e-school.et", "changeme") ?? "",
      /at least 10/,
    );
    assert.match(
      validateBootstrapAdmin("admin@e-school.et", "change-me!") ?? "",
      /letters and numbers/,
    );
    assert.match(validateBootstrapAdmin("not-an-email", "iLueEHYm5N") ?? "", /email/);
  });
});
