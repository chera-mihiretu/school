import { createAppContainer } from "./composition/container.ts";

const container = createAppContainer();
const { config, logger, seedFirstAdmin } = container.cradle;

const result = await seedFirstAdmin({
  email: config.auth.platformAdminEmail,
  password: config.auth.platformAdminPassword,
});

function exitAfterFlush(code: number): void {
  logger.flush(() => {
    void container.dispose().finally(() => {
      process.exit(code);
    });
  });
}

if (!result.ok) {
  logger.error({ event: "seed.invalid" }, result.error);
  exitAfterFlush(1);
} else if (result.status === "created") {
  logger.info(
    { event: "seed.created", email: result.email },
    "seeded first platform admin",
  );
  exitAfterFlush(0);
} else if (result.status === "skipped") {
  logger.info(
    { event: "seed.skipped" },
    "platform admin already exists; seed skipped",
  );
  exitAfterFlush(0);
} else {
  const exhaustive: never = result;
  logger.error({ event: "seed.unknown", result: exhaustive }, "unhandled seed result");
  exitAfterFlush(1);
}
