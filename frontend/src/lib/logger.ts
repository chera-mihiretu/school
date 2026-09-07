import "server-only";
import pino from "pino";

const LEVELS = ["fatal", "error", "warn", "info", "debug", "trace"] as const;

type PinoLevel = (typeof LEVELS)[number];

export type CreateLoggerOptions = {
  service: string;
  level?: string | undefined;
  stdout?: NodeJS.WritableStream | undefined;
  stderr?: NodeJS.WritableStream | undefined;
};

function isPinoLevel(value: string): value is PinoLevel {
  return (LEVELS as readonly string[]).includes(value);
}

function resolveLevel(explicit?: string): PinoLevel {
  const configured = explicit ?? process.env.LOG_LEVEL;
  if (configured !== undefined && isPinoLevel(configured)) {
    return configured;
  }

  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function resolveService(fallback: string): string {
  return process.env.SERVICE_TAG ?? fallback;
}

export function createLogger(options: CreateLoggerOptions) {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;

  return pino(
    {
      level: resolveLevel(options.level),
      base: {
        service: resolveService(options.service),
        env: process.env.NODE_ENV ?? "development",
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "*.password",
          "*.secret",
          "*.token",
        ],
        remove: true,
      },
      serializers: {
        err: pino.stdSerializers.err,
      },
      formatters: {
        level(label) {
          return { level: label };
        },
      },
    },
    pino.multistream(
      [
        { level: "trace", stream: stdout },
        { level: "error", stream: stderr },
      ],
      { dedupe: true },
    ),
  );
}

export const logger = createLogger({ service: "frontend-service" });
