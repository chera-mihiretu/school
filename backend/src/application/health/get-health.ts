import type { Health } from "../../domain/health/health.ts";
import type { DatabasePort } from "../../domain/ports/database-port.ts";

export type GetHealth = () => Promise<Health>;

export function createGetHealth(
  serviceName: string,
  database: DatabasePort,
): GetHealth {
  return async () => {
    try {
      await database.ping();
      return { ok: true, service: serviceName, database: "up" };
    } catch {
      return { ok: false, service: serviceName, database: "down" };
    }
  };
}
