import nodemailer from "nodemailer";
import type { MailerPort } from "../../domain/ports/mailer-port.ts";
import {
  isMailConfigured,
  type MailConfig,
} from "../config/mail-config.ts";

export function createSmtpMailer(config: MailConfig): MailerPort {
  const host = config.host;
  const from = config.from;
  const transporter =
    isMailConfigured(config) && host !== undefined
      ? nodemailer.createTransport({
          host,
          port: config.port,
          secure: config.secure,
          ...(config.user !== undefined && config.pass !== undefined
            ? { auth: { user: config.user, pass: config.pass } }
            : {}),
        })
      : undefined;

  return {
    async send(input) {
      if (transporter === undefined || from === undefined) {
        return { ok: false, error: "SMTP is not configured" };
      }

      try {
        const info = await transporter.sendMail({
          from,
          to: input.to,
          subject: input.subject,
          text: input.text,
          ...(input.html !== undefined ? { html: input.html } : {}),
        });
        if (Array.isArray(info.rejected) && info.rejected.length > 0) {
          return { ok: false, error: "SMTP rejected the recipient" };
        }
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Failed to send email",
        };
      }
    },
  };
}
