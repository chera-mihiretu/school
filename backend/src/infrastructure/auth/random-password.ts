import { randomBytes } from "node:crypto";
import type { PasswordGeneratorPort } from "../../domain/ports/password-generator-port.ts";

const DEFAULT_LENGTH = 20;
const ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function createCryptoPasswordGenerator(
  length = DEFAULT_LENGTH,
): PasswordGeneratorPort {
  const size = Math.max(16, length);

  return {
    generate() {
      const bytes = randomBytes(size);
      let password = "";
      for (const byte of bytes) {
        password += ALPHABET[byte % ALPHABET.length];
      }
      return password;
    },
  };
}
