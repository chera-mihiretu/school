import type { PlatformAdminCredentialsPort } from "../../domain/ports/platform-admin-credentials-port.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { PlatformAdminStorePort } from "../../domain/ports/platform-admin-store-port.ts";

export function createStoredCredentials(deps: {
  store: PlatformAdminStorePort;
  hasher: PasswordHasherPort;
}): PlatformAdminCredentialsPort {
  const { store, hasher } = deps;
  let dummyHash: string | undefined;

  async function dummyVerify(password: string): Promise<void> {
    dummyHash ??= await hasher.hash("timing-or-unknown-admin");
    await hasher.verify(dummyHash, password);
  }

  return {
    async verify(email, password) {
      const passwordHash = await store.findPasswordHashByEmail(email);
      if (passwordHash === undefined) {
        await dummyVerify(password);
        return false;
      }

      return hasher.verify(passwordHash, password);
    },
  };
}
