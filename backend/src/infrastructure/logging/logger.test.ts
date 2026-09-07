import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { describe, it } from "node:test";
import { createLogger } from "./logger.ts";

function collectStream() {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(String(chunk));
      callback();
    },
  });

  return { stream, chunks };
}

async function flush(log: ReturnType<typeof createLogger>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    log.flush((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function parseLast(chunks: string[]): Record<string, unknown> {
  const raw = chunks.join("").trim().split("\n").at(-1);
  assert.ok(raw, "expected a log line");
  return JSON.parse(raw) as Record<string, unknown>;
}

describe("createLogger", () => {
  it("writes info records to stdout as structured JSON", async () => {
    const stdout = collectStream();
    const stderr = collectStream();
    const log = createLogger({
      service: "backend-service",
      level: "info",
      stdout: stdout.stream,
      stderr: stderr.stream,
    });

    log.info({ event: "test.info" }, "hello stdout");
    await flush(log);

    assert.equal(stderr.chunks.length, 0);
    const record = parseLast(stdout.chunks);
    assert.equal(record["level"], "info");
    assert.equal(record["msg"], "hello stdout");
    assert.equal(record["service"], "backend-service");
    assert.equal(record["event"], "test.info");
  });

  it("writes error records to stderr as structured JSON", async () => {
    const stdout = collectStream();
    const stderr = collectStream();
    const log = createLogger({
      service: "backend-service",
      level: "info",
      stdout: stdout.stream,
      stderr: stderr.stream,
    });

    log.error({ event: "test.error" }, "hello stderr");
    await flush(log);

    assert.equal(stdout.chunks.length, 0);
    const record = parseLast(stderr.chunks);
    assert.equal(record["level"], "error");
    assert.equal(record["msg"], "hello stderr");
    assert.equal(record["service"], "backend-service");
    assert.equal(record["event"], "test.error");
  });
});
