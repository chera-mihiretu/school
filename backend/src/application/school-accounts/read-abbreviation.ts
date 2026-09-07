import { authorizeAppAbbreviationStep } from "./authorize-abbreviation.ts";
import {
  lookupAbbreviationCode,
  readAbbreviationPreview,
  type AbbreviationLookup,
  type AbbreviationPreview,
} from "../school-abbreviation/preview.ts";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";

export type ReadAppAbbreviationInput = {
  hostHeader: string;
  token: string | undefined;
  code?: string;
  now?: Date;
};

export type ReadAppAbbreviationResult =
  | { ok: true; preview: AbbreviationPreview; lookup?: AbbreviationLookup }
  | { ok: false; status: 401 | 403 | 409; error: string };

export type ReadAppAbbreviation = (
  input: ReadAppAbbreviationInput,
) => Promise<ReadAppAbbreviationResult>;

export function createReadAppAbbreviation(deps: {
  rootHost: string;
  tenants: TenantStorePort;
  sessions: SchoolSessionSignerPort;
}): ReadAppAbbreviation {
  const { rootHost, tenants, sessions } = deps;

  return async (input) => {
    const authorized = await authorizeAppAbbreviationStep({
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
