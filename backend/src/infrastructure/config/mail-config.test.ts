import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isMailConfigured, loadMailConfig } from "./mail-config.ts";

describe("loadMailConfig", () => {
  it("reads SMTP settings without throwing when they are missing", () => {
    const config = loadMailConfig({});
    assert.equal(config.host, undefined);
    assert.equal(config.from, undefined);
    assert.equal(config.port, 587);
    assert.equal(config.secure, false);
    assert.equal(isMailConfigured(config), false);
  });

  it("reads a complete SMTP setup", () => {
    const config = loadMailConfig({
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "465",
      SMTP_USER: "mailer",
      SMTP_PASS: "secret",
      MAIL_FROM: "e-school.et <accounts@e-school.et>",
      SMTP_SECURE: "true",
    });
    assert.equal(config.host, "smtp.example.com");
    assert.equal(config.port, 465);
    assert.equal(config.user, "mailer");
    assert.equal(config.from, "e-school.et <accounts@e-school.et>");
    assert.equal(config.secure, true);
    assert.equal(isMailConfigured(config), true);
  });
});
