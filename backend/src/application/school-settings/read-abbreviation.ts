import { authorizeCampusDirector } from "../teachers/authorize-campus.ts";
import {
  lookupAbbreviationCode,
  readAbbreviationPreview,
  type AbbreviationLookup,
  type AbbreviationPreview,
} from "../school-abbreviation/preview.ts";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";

export type ReadSettingsAbbreviationInput = {
  hostHeader: string;
  token: string | undefined;
  code?: string;
  now?: Date;
};

export type ReadSettingsAbbreviationResult =
  | { ok: true; preview: AbbreviationPreview; lookup?: AbbreviationLookup }
  | { ok: false; status: 401 | 403; error: string };

export type ReadSettingsAbbreviation = (
  input: ReadSettingsAbbreviationInput,
) => Promise<ReadSettingsAbbreviationResult>;

export function createReadSettingsAbbreviation(deps: {
  rootHost: string;
  tenants: TenantStorePort;
  sessions: SchoolSessionSignerPort;
}): ReadSettingsAbbreviation {
  const { rootHost, tenants, sessions } = deps;

  return async (input) => {
    const authorized = await authorizeCampusDirector({
      hostHeader: input.hostHeader,
      token: input.token,
      rootHost,
      tenants,
      sessions,
    });
    if (!authorized.ok) {
      return authorized;
    }

    const preview = await readAbbreviationPreview(
      tenants,
      authorized.context.tenant.abbreviation,
      input.now ?? new Date(),
    );
    const code = input.code?.trim() ?? "";
    if (code.length === 0) {
      return { ok: true, preview };
    }

    return {
      ok: true,
      preview,
      lookup: await lookupAbbreviationCode(tenants, code),
    };
  };
}
