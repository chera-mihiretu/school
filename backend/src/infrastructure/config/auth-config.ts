import { stripHostPort } from "../../domain/platform-admin/host.ts";
import {
  DEFAULT_PUBLIC_HOST,
  DEFAULT_PUBLIC_PROTOCOL,
  loadPublicUrlParts,
} from "./public-url.ts";

export type AuthConfig = {
  rootHost: string;
  protocol: string;
  publicHost: string;
  platformAdminEmail: string;
  platformAdminPassword: string;
  sessionSecret: string;
  sessionTtlSeconds: number;
};

export function loadAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const parts = loadPublicUrlParts({
    APP_PROTOCOL: env["APP_PROTOCOL"] ?? DEFAULT_PUBLIC_PROTOCOL,
    APP_HOST: env["APP_HOST"] ?? DEFAULT_PUBLIC_HOST,
  });
  const rootHost = stripHostPort(parts.host);
  const platformAdminEmail = env["PLATFORM_ADMIN_EMAIL"];
  const platformAdminPassword = env["PLATFORM_ADMIN_PASSWORD"];
  const sessionSecret = env["SESSION_SECRET"];
  const rawTtl = env["SESSION_TTL_SECONDS"] ?? "28800";
  const sessionTtlSeconds = Number.parseInt(rawTtl, 10);

  if (platformAdminEmail === undefined || platformAdminEmail.length === 0) {
    throw new Error("PLATFORM_ADMIN_EMAIL is required");
  }
  if (platformAdminPassword === undefined || platformAdminPassword.length === 0) {
    throw new Error("PLATFORM_ADMIN_PASSWORD is required");
  }
  if (sessionSecret === undefined || sessionSecret.length < 16) {
    throw new Error("SESSION_SECRET must be at least 16 characters");
  }
  if (env["NODE_ENV"] === "production" && sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters in production");
  }
  if (!Number.isInteger(sessionTtlSeconds) || sessionTtlSeconds < 60) {
    throw new Error(`Invalid SESSION_TTL_SECONDS: ${rawTtl}`);
  }

  return {
    rootHost,
    protocol: parts.protocol,
    publicHost: parts.host,
    platformAdminEmail,
    platformAdminPassword,
    sessionSecret,
    sessionTtlSeconds,
  };
}
