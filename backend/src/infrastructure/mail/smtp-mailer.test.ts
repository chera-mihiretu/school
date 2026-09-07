import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSmtpMailer } from "./smtp-mailer.ts";

describe("createSmtpMailer", () => {
  it("returns ok false without throwing when SMTP is missing", async () => {
    const mailer = createSmtpMailer({
      host: undefined,
      port: 587,
      user: undefined,
      pass: undefined,
      from: undefined,
      secure: false,
    });

    const result = await mailer.send({
      to: "head@north-hall.et",
      subject: "Test",
      text: "Hello",
    });

    assert.deepEqual(result, { ok: false, error: "SMTP is not configured" });
  });
});
