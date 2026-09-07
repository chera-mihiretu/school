import { rejectIfNotAppHost } from "./require-app-host.ts";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import { validateNewSchoolPassword } from "../../domain/school-accounts/password.ts";
import type { SchoolSessionView } from "../../domain/school-accounts/session.ts";
import { toSchoolSessionView } from "../../domain/school-accounts/session.ts";

export type ChangePasswordInput = {
  hostHeader: string;
  accountId: string;
  expiresAt: string;
  currentPassword: string;
  newPassword: string;
};

export type ChangeSchoolAccountPasswordResult =
  | { ok: true; session: SchoolSessionView }
  | { ok: false; status: 400 | 401 | 403; error: string };

export type ChangeSchoolAccountPassword = (
  input: ChangePasswordInput,
) => Promise<ChangeSchoolAccountPasswordResult>;

export function createChangeSchoolAccountPassword(deps: {
  rootHost: string;
  store: TenantStorePort;
  hasher: PasswordHasherPort;
}): ChangeSchoolAccountPassword {
  const { rootHost, store, hasher } = deps;

  return async (input) => {
    const rejected = rejectIfNotAppHost(input.hostHeader, rootHost);
    if (rejected !== undefined) {
      return rejected;
    }

    const invalid = validateNewSchoolPassword({
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    });
    if (invalid !== undefined) {
      return { ok: false, status: 400, error: invalid };
    }

    const auth = await store.findAuthById(input.accountId);
    if (auth === undefined) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    if (auth.tenant.status === "suspended") {
      return { ok: false, status: 403, error: "This school account is suspended" };
    }

    if (auth.tenant.slug !== null) {
      return { ok: false, status: 403, error: "Use your campus host" };
    }

    if (!(await hasher.verify(auth.passwordHash, input.currentPassword))) {
      return { ok: false, status: 401, error: "Invalid email or password" };
    }

    const passwordHash = await hasher.hash(input.newPassword);
    const updated = await store.updatePassword({
      id: auth.tenant.id,
      passwordHash,
      mustChangePassword: false,
    });
    if (!updated.ok) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    const email = updated.tenant.email ?? auth.tenant.email;
    if (email === null) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    return {
      ok: true,
      session: toSchoolSessionView({
        accountId: updated.tenant.id,
        email,
        expiresAt: new Date(input.expiresAt),
        mustChangePassword: false,
        slug: updated.tenant.slug,
        abbreviation: updated.tenant.abbreviation,
      }),
    };
  };
}
