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

describe("useCampusDashboardStore", () => {
  it("toggles the mobile drawer and resets", async () => {
    const { useCampusDashboardStore } = await import(
      "./campus-dashboard-store.ts"
    );
    useCampusDashboardStore.getState().reset();
    assert.equal(useCampusDashboardStore.getState().drawerOpen, false);
    useCampusDashboardStore.getState().setDrawerOpen(true);
    assert.equal(useCampusDashboardStore.getState().drawerOpen, true);
    useCampusDashboardStore.getState().reset();
    assert.equal(useCampusDashboardStore.getState().drawerOpen, false);
  });
});
