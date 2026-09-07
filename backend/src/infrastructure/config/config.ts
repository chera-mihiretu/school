import { loadAuthConfig, type AuthConfig } from "./auth-config.ts";
import {
  loadDatabaseSettings,
  type DatabaseSettings,
} from "./database-url.ts";
import { loadMailConfig, type MailConfig } from "./mail-config.ts";

export type AppConfig = {
  port: number;
  serviceName: string;
  nodeEnv: string;
  database: DatabaseSettings;
  auth: AuthConfig;
  mail: MailConfig;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const rawPort = env["PORT"] ?? "5000";
  const parsedPort = Number.parseInt(rawPort, 10);

  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error(`Invalid PORT: ${rawPort}`);
  }

  return {
    port: parsedPort,
    serviceName: env["SERVICE_TAG"] ?? "backend-service",
    nodeEnv: env["NODE_ENV"] ?? "development",
    database: loadDatabaseSettings(env),
    auth: loadAuthConfig(env),
    mail: loadMailConfig(env),
  };
}
