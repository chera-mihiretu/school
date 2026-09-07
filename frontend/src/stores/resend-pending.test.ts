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

describe("create-school-store resend pending", () => {
  it("setResendPending(true) sets resendPending", async () => {
    const { useCreateSchoolStore } = await import("./create-school-store.ts");
    useCreateSchoolStore.getState().reset();
    assert.equal(useCreateSchoolStore.getState().resendPending, false);
    useCreateSchoolStore.getState().setResendPending(true);
    assert.equal(useCreateSchoolStore.getState().resendPending, true);
    useCreateSchoolStore.getState().reset();
  });
});

describe("schools-list-store resend pending", () => {
  it("setResendPending(true) sets resendPending", async () => {
    const { useSchoolsListStore } = await import("./schools-list-store.ts");
    useSchoolsListStore.getState().setResendPending(false);
    assert.equal(useSchoolsListStore.getState().resendPending, false);
    useSchoolsListStore.getState().setResendPending(true);
    assert.equal(useSchoolsListStore.getState().resendPending, true);
    useSchoolsListStore.getState().setResendPending(false);
  });
});
