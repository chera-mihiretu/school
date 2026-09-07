import { createAppContainer } from "./composition/container.ts";

const container = createAppContainer();
const {
  config,
  logger,
  httpServer,
  platformAdminStore,
  featuredSchoolStore,
  tenantStore,
  contactMessageStore,
} = container.cradle;

try {
  await platformAdminStore.ensureSchema();
  await featuredSchoolStore.ensureSchema();
  await tenantStore.ensureSchema();
  await contactMessageStore.ensureSchema();
} catch (err) {
  logger.fatal({ err, event: "schema.platform" }, "failed to apply platform schema");
  logger.flush(() => {
    process.exit(1);
  });
}

httpServer.on("error", (err) => {
  logger.fatal({ err, event: "server.error" }, "server failed");
  logger.flush(() => {
    process.exit(1);
  });
});

httpServer.listen(config.port, () => {
  logger.info(
    { event: "server.listen", port: config.port },
    "backend listening",
  );

  const databaseHost = new URL(config.database.url).hostname;
  void container.cradle.database.ping().then(
    () => {
      logger.info(
        {
          event: "database.connected",
          host: databaseHost,
          ssl: config.database.ssl,
        },
        "database reachable",
      );
    },
    (err: unknown) => {
      logger.error(
        { err, event: "database.connect_failed", host: databaseHost },
        "database unreachable",
      );
    },
  );
});

function shutdown(signal: string): void {
  logger.info({ event: "server.shutdown", signal }, "received shutdown signal");

  httpServer.close((error) => {
    if (error) {
      logger.error({ err: error, event: "server.close" }, "error during close");
      logger.flush(() => {
        process.exit(1);
      });
      return;
    }

    void container.dispose().finally(() => {
      logger.flush(() => {
        process.exit(0);
      });
    });
  });
}

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err, event: "uncaughtException" }, "uncaught exception");
  logger.flush(() => {
    process.exit(1);
  });
});

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason, event: "unhandledRejection" }, "unhandled rejection");
});
