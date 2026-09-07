import {
  normalizeAdminEmail,
  validateBootstrapAdmin,
} from "../../domain/platform-admin/credentials.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { PlatformAdminStorePort } from "../../domain/ports/platform-admin-store-port.ts";

export type SeedFirstAdminInput = {
  email: string;
  password: string;
};

export type SeedFirstAdminResult =
  | { ok: true; status: "created"; email: string }
  | { ok: true; status: "skipped" }
  | { ok: false; error: string };

export type SeedFirstAdmin = (
  input: SeedFirstAdminInput,
) => Promise<SeedFirstAdminResult>;

export function createSeedFirstAdmin(deps: {
  store: PlatformAdminStorePort;
  hasher: PasswordHasherPort;
}): SeedFirstAdmin {
  const { store, hasher } = deps;

  return async (input) => {
    const email = normalizeAdminEmail(input.email);
    const invalid = validateBootstrapAdmin(email, input.password);
    if (invalid !== undefined) {
      return { ok: false, error: invalid };
    }

    await store.ensureSchema();
    const passwordHash = await hasher.hash(input.password);
    const inserted = await store.insertFirstAdmin({ email, passwordHash });

    if (inserted === "exists") {
      return { ok: true, status: "skipped" };
    }

    return { ok: true, status: "created", email };
  };
}
