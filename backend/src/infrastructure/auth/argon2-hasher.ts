import { argon2idAsync } from "@noble/hashes/argon2.js";
import { randomBytes, timingSafeEqual } from "node:crypto";
import type { PasswordHasherPort } from "../../domain/ports/password-hasher-port.ts";

export type Argon2HasherParams = {
  memoryCostKiB: number;
  timeCost: number;
  parallelism: number;
  hashLength: number;
};

/** OWASP-aligned Argon2id for interactive logins (64 MiB, 3 iterations). */
export const PRODUCTION_ARGON2_PARAMS: Argon2HasherParams = {
  memoryCostKiB: 65_536,
  timeCost: 3,
  parallelism: 1,
  hashLength: 32,
};

type ParsedPhc = {
  memoryCostKiB: number;
  timeCost: number;
  parallelism: number;
  salt: Buffer;
  hash: Buffer;
};

function toPhcBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64").replace(/=+$/u, "");
}

function fromPhcBase64(value: string): Buffer {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

function encodePhc(input: {
  params: Argon2HasherParams;
  salt: Uint8Array;
  hash: Uint8Array;
}): string {
  const { params, salt, hash } = input;
  return [
    "$argon2id$v=19",
    `$m=${params.memoryCostKiB},t=${params.timeCost},p=${params.parallelism}`,
    `$${toPhcBase64(salt)}`,
    `$${toPhcBase64(hash)}`,
  ].join("");
}

function parsePhc(encoded: string): ParsedPhc | undefined {
  const match = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/.exec(
    encoded,
  );
  if (match === null) {
    return undefined;
  }

  const memoryCostKiB = Number.parseInt(match[1] ?? "", 10);
  const timeCost = Number.parseInt(match[2] ?? "", 10);
  const parallelism = Number.parseInt(match[3] ?? "", 10);
  const salt = fromPhcBase64(match[4] ?? "");
  const hash = fromPhcBase64(match[5] ?? "");

  if (
    !Number.isInteger(memoryCostKiB) ||
    !Number.isInteger(timeCost) ||
    !Number.isInteger(parallelism) ||
    salt.length === 0 ||
    hash.length === 0
  ) {
    return undefined;
  }

  return { memoryCostKiB, timeCost, parallelism, salt, hash };
}

async function derive(
  password: string,
  salt: Uint8Array,
  params: { memoryCostKiB: number; timeCost: number; parallelism: number; hashLength: number },
): Promise<Uint8Array> {
  return argon2idAsync(password, salt, {
    t: params.timeCost,
    m: params.memoryCostKiB,
    p: params.parallelism,
    dkLen: params.hashLength,
    maxmem: Math.max(params.memoryCostKiB * 1024 * 2, 1024 * 1024),
  });
}

export function createArgon2PasswordHasher(
  params: Argon2HasherParams = PRODUCTION_ARGON2_PARAMS,
): PasswordHasherPort {
  return {
    async hash(password: string) {
      const salt = randomBytes(16);
      const hash = await derive(password, salt, params);
      return encodePhc({ params, salt, hash });
    },
    async verify(passwordHash: string, password: string) {
      const parsed = parsePhc(passwordHash);
      if (parsed === undefined) {
        return false;
      }

      const computed = await derive(password, parsed.salt, {
        memoryCostKiB: parsed.memoryCostKiB,
        timeCost: parsed.timeCost,
        parallelism: parsed.parallelism,
        hashLength: parsed.hash.length,
      });
      const left = Buffer.from(computed);
      if (left.length !== parsed.hash.length) {
        return false;
      }

      return timingSafeEqual(left, parsed.hash);
    },
  };
}
