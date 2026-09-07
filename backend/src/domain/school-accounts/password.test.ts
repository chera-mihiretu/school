import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateNewSchoolPassword } from "./password.ts";

describe("validateNewSchoolPassword", () => {
  it("rejects a password shorter than 12 characters", () => {
    assert.equal(
      validateNewSchoolPassword({
        currentPassword: "temporary-pass",
        newPassword: "short-pass",
      }),
      "Password must be at least 12 characters",
    );
  });

  it("rejects a new password equal to the current one", () => {
    assert.equal(
      validateNewSchoolPassword({
        currentPassword: "temporary-pass",
        newPassword: "temporary-pass",
      }),
      "New password must be different from the current password",
    );
  });

  it("accepts a longer replacement", () => {
    assert.equal(
      validateNewSchoolPassword({
        currentPassword: "temporary-pass",
        newPassword: "a-kept-password",
      }),
      undefined,
    );
  });
});
