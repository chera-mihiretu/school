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

describe("create-school-store resend done dialog", () => {
  it("openResendDone and dismissResendDone toggle resendDoneOpen", async () => {
    const { useCreateSchoolStore } = await import("./create-school-store.ts");
    useCreateSchoolStore.getState().reset();
    assert.equal(useCreateSchoolStore.getState().resendDoneOpen, false);
    useCreateSchoolStore.getState().openResendDone({
      school: {
        id: "school-1",
        name: "North Hall",
        slug: null,
        username: null,
        email: "head@north-hall.et",
        status: "pending_setup",
        created: "2026-09-07T00:00:00.000Z",
        founded: "Founded 2026",
        host: null,
        mustChangePassword: true,
        lastMailAt: "2026-09-07T00:00:00.000Z",
        lastMailOk: true,
        lastMailError: null,
        signedInAt: null,
      },
      credentials: {
        email: "head@north-hall.et",
        password: "temp-password-16x",
        firstLoginUrl: "http://app.e-school.et:3000/first-login",
      },
      emailSent: true,
    });
    const afterOpen = useCreateSchoolStore.getState();
    assert.equal(afterOpen.resendDoneOpen, true);
    assert.equal(afterOpen.emailSent, true);
    assert.equal(afterOpen.school?.id, "school-1");
    assert.equal(afterOpen.credentials?.password, "temp-password-16x");
    useCreateSchoolStore.getState().dismissResendDone();
    assert.equal(useCreateSchoolStore.getState().resendDoneOpen, false);
    useCreateSchoolStore.getState().reset();
  });

  it("reveal opens the same dialog with first-create credentials", async () => {
    const { useCreateSchoolStore } = await import("./create-school-store.ts");
    useCreateSchoolStore.getState().reset();
    useCreateSchoolStore.getState().reveal({
      schoolId: "school-1",
      school: {
        id: "school-1",
        name: "North Hall",
        slug: null,
        username: null,
        email: "head@north-hall.et",
        status: "pending_setup",
        created: "2026-09-07T00:00:00.000Z",
        founded: "Founded 2026",
        host: null,
        mustChangePassword: true,
        lastMailAt: "2026-09-07T00:00:00.000Z",
        lastMailOk: true,
        lastMailError: null,
        signedInAt: null,
      },
      credentials: {
        email: "head@north-hall.et",
        password: "first-temp",
        firstLoginUrl: "http://app.e-school.et:3000/first-login",
      },
      emailSent: true,
    });
    const state = useCreateSchoolStore.getState();
    assert.equal(state.resendDoneOpen, true);
    assert.equal(state.credentials?.password, "first-temp");
    useCreateSchoolStore.getState().reset();
  });
});
