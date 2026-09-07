export type MailConfig = {
  host: string | undefined;
  port: number;
  user: string | undefined;
  pass: string | undefined;
  from: string | undefined;
  secure: boolean;
};

export function isMailConfigured(config: MailConfig): boolean {
  return (
    config.host !== undefined &&
    config.host.length > 0 &&
    config.from !== undefined &&
    config.from.length > 0
  );
}

export function loadMailConfig(env: NodeJS.ProcessEnv = process.env): MailConfig {
  const rawPort = env["SMTP_PORT"] ?? "587";
  const parsedPort = Number.parseInt(rawPort, 10);
  const port =
    Number.isInteger(parsedPort) && parsedPort >= 1 && parsedPort <= 65535
      ? parsedPort
      : 587;

  const secureRaw = env["SMTP_SECURE"];
  const secure =
    secureRaw === "true" || secureRaw === "1" || (secureRaw === undefined && port === 465);

  const host = env["SMTP_HOST"];
  const user = env["SMTP_USER"];
  const pass = env["SMTP_PASS"];
  const from = env["MAIL_FROM"];

  return {
    host: host !== undefined && host.length > 0 ? host : undefined,
    port,
    user: user !== undefined && user.length > 0 ? user : undefined,
    pass: pass !== undefined && pass.length > 0 ? pass : undefined,
    from: from !== undefined && from.length > 0 ? from : undefined,
    secure,
  };
}
