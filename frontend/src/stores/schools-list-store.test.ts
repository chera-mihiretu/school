import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      extname(specifier) === ""
    ) {
      const parentDir = context.parentURL
        ? dirname(fileURLToPath(context.parentURL))
        : process.cwd();
      if (existsSync(join(parentDir, `${specifier}.ts`))) {
        return nextResolve(`${specifier}.ts`, context);
      }
    }
    return nextResolve(specifier, context);
  },
});

describe("schools-list-store resend done dialog", () => {
  it("openResendDone and dismissResendDone toggle resendDoneOpen", async () => {
    const { useSchoolsListStore } = await import("./schools-list-store.ts");
    useSchoolsListStore.getState().dismissResendDone();
    assert.equal(useSchoolsListStore.getState().resendDoneOpen, false);
    useSchoolsListStore.getState().openResendDone({
      credentials: {
        email: "head@north-hall.et",
        password: "temp-password-16x",
        firstLoginUrl: "http://app.e-school.et:3000/first-login",
      },
      emailSent: true,
    });
    assert.equal(useSchoolsListStore.getState().resendDoneOpen, true);
    assert.equal(
      useSchoolsListStore.getState().credentials?.password,
      "temp-password-16x",
    );
    useSchoolsListStore.getState().dismissResendDone();
    assert.equal(useSchoolsListStore.getState().resendDoneOpen, false);
    assert.equal(useSchoolsListStore.getState().credentials, null);
  });
});
