import type { Instrumentation } from "next";
import { logger } from "./lib/logger";

export function registerNodeInstrumentation(): void {
  logger.info({ event: "frontend.boot" }, "frontend process registered");

  process.on("uncaughtException", (err) => {
    logger.fatal({ err, event: "uncaughtException" }, "uncaught exception");
    logger.flush(() => {
      process.exit(1);
    });
  });

  process.on("unhandledRejection", (reason) => {
    logger.error(
      { err: reason, event: "unhandledRejection" },
      "unhandled rejection",
    );
  });
}

export function logRequestError(
  error: unknown,
  request: Parameters<Instrumentation.onRequestError>[1],
  context: Parameters<Instrumentation.onRequestError>[2],
): void {
  logger.error(
    {
      err: error,
      event: "next.onRequestError",
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    },
    "unhandled request error",
  );
}
