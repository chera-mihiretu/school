import { createHmac, timingSafeEqual } from "node:crypto";
import type { SchoolSessionSignerPort } from "../../domain/ports/school-session-signer-port.ts";
import {
  isCampusAccountKind,
  type CampusAccountKind,
} from "../../domain/school-accounts/session.ts";

type Payload = {
  accountId: string;
  email: string;
  exp: number;
  kind?: CampusAccountKind;
};

function schoolSecret(secret: string): string {
  return `${secret}:school-account-session`;
}

function toBase64Url(value: Buffer | string): string {
  const buffer = typeof value === "string" ? Buffer.from(value) : value;
  return buffer.toString("base64url");
}

function sign(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createHmacSchoolSessionSigner(input: {
  secret: string;
  ttlSeconds: number;
  now?: () => Date;
}): SchoolSessionSignerPort {
  const now = input.now ?? (() => new Date());
  const secret = schoolSecret(input.secret);

  return {
    issue(claims) {
      const expiresAt = new Date(now().getTime() + input.ttlSeconds * 1000);
      const payload: Payload = {
        accountId: claims.accountId,
        email: claims.email,
        exp: Math.floor(expiresAt.getTime() / 1000),
        ...(claims.kind !== undefined ? { kind: claims.kind } : {}),
      };
      const data = toBase64Url(JSON.stringify(payload));
      return { token: `${data}.${sign(secret, data)}`, expiresAt };
    },
    read(token) {
      const [data, signature] = token.split(".");
      if (data === undefined || signature === undefined) {
        return undefined;
      }

      const expected = sign(secret, data);
      const given = Buffer.from(signature);
      const good = Buffer.from(expected);
      if (given.length !== good.length || !timingSafeEqual(given, good)) {
        return undefined;
      }

      try {
        const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as Payload;
        if (
          typeof payload.accountId !== "string" ||
          payload.accountId.length === 0 ||
          typeof payload.email !== "string" ||
          typeof payload.exp !== "number"
        ) {
          return undefined;
        }
        if (payload.exp * 1000 <= now().getTime()) {
          return undefined;
        }
        if (payload.kind !== undefined && !isCampusAccountKind(payload.kind)) {
          return undefined;
        }
        return {
          accountId: payload.accountId,
          email: payload.email,
          expiresAt: new Date(payload.exp * 1000),
          ...(payload.kind !== undefined ? { kind: payload.kind } : {}),
        };
      } catch {
        return undefined;
      }
    },
  };
}
