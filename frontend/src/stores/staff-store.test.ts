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

const staff = {
  id: "staff-1",
  givenName: "Hana",
  fatherName: "Bekele",
  grandfatherName: "Tessema",
  displayName: "Hana Bekele Tessema",
  sex: "female" as const,
  phone: "+251911223344",
  email: "hana@north-hall.et",
  employeeId: "AAAF/00001/26",
  mustChangePassword: true,
  lastMailAt: "2026-09-07T08:00:00.000Z",
  lastMailOk: true,
  lastMailError: null,
  signedInAt: null,
  createdAt: "2026-09-07T08:00:00.000Z",
};

const credentials = {
  email: "hana@north-hall.et",
  password: "temp-password-16x",
  loginUrl: "http://north-hall.e-school.et:3000/login",
  schoolId: "AAAF/00001/26",
};

describe("staff-store credentials dialog", () => {
  it("reveal opens the dialog, prepends the staff member, and clears the draft", async () => {
    const { useStaffStore } = await import("./staff-store.ts");
    useStaffStore.getState().reset();
    useStaffStore.getState().setGivenName("Hana");
    useStaffStore.getState().reveal({
      staff,
      credentials,
      emailSent: true,
    });
    const state = useStaffStore.getState();
    assert.equal(state.revealOpen, true);
    assert.equal(state.staff[0]?.id, "staff-1");
    assert.equal(state.credentials?.password, "temp-password-16x");
    assert.equal(state.givenName, "");
    assert.equal(state.emailSent, true);
    useStaffStore.getState().dismissReveal();
    assert.equal(useStaffStore.getState().revealOpen, false);
    assert.equal(useStaffStore.getState().credentials?.password, "temp-password-16x");
    useStaffStore.getState().reset();
  });

  it("openResendDone updates the row and opens the same dialog", async () => {
    const { useStaffStore } = await import("./staff-store.ts");
    useStaffStore.getState().reset();
    useStaffStore.getState().hydrate([staff]);
    useStaffStore.getState().openResendDone({
      staff: { ...staff, lastMailOk: false, lastMailError: "refused" },
      credentials,
      emailSent: false,
      emailError: "refused",
    });
    const state = useStaffStore.getState();
    assert.equal(state.revealOpen, true);
    assert.equal(state.staff[0]?.lastMailOk, false);
    assert.equal(state.emailSent, false);
    assert.equal(state.emailError, "refused");
    useStaffStore.getState().reset();
  });

  it("resetDraft clears the form and credentials without dropping the list", async () => {
    const { useStaffStore } = await import("./staff-store.ts");
    useStaffStore.getState().reset();
    useStaffStore.getState().hydrate([staff]);
    useStaffStore.getState().setGivenName("Hana");
    useStaffStore.getState().reveal({
      staff,
      credentials,
      emailSent: true,
    });
    useStaffStore.getState().resetDraft();
    const state = useStaffStore.getState();
    assert.equal(state.givenName, "");
    assert.equal(state.credentials, null);
    assert.equal(state.revealOpen, false);
    assert.equal(state.staff[0]?.id, "staff-1");
    useStaffStore.getState().reset();
  });
});
