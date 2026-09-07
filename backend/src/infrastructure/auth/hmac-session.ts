import { createHmac, timingSafeEqual } from "node:crypto";
import type { SessionSignerPort } from "../../domain/ports/session-signer-port.ts";

type Payload = {
  email: string;
  exp: number;
};

function toBase64Url(value: Buffer | string): string {
  const buffer = typeof value === "string" ? Buffer.from(value) : value;
  return buffer.toString("base64url");
}

function sign(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createHmacSessionSigner(input: {
  secret: string;
  ttlSeconds: number;
  now?: () => Date;
}): SessionSignerPort {
  const now = input.now ?? (() => new Date());

  return {
    issue(email: string) {
      const expiresAt = new Date(now().getTime() + input.ttlSeconds * 1000);
      const payload: Payload = { email, exp: Math.floor(expiresAt.getTime() / 1000) };
      const data = toBase64Url(JSON.stringify(payload));
      return { token: `${data}.${sign(input.secret, data)}`, expiresAt };
    },
    read(token: string) {
      const [data, signature] = token.split(".");
      if (data === undefined || signature === undefined) {
        return undefined;
      }

      const expected = sign(input.secret, data);
      const given = Buffer.from(signature);
      const good = Buffer.from(expected);
      if (given.length !== good.length || !timingSafeEqual(given, good)) {
        return undefined;
      }

      try {
        const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as Payload;
        if (typeof payload.email !== "string" || typeof payload.exp !== "number") {
          return undefined;
        }
        if (payload.exp * 1000 <= now().getTime()) {
          return undefined;
        }
        return {
          email: payload.email,
          expiresAt: new Date(payload.exp * 1000),
        };
      } catch {
        return undefined;
      }
    },
  };
}
