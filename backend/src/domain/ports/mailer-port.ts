export type MailerSendInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type MailerSendResult =
  | { ok: true }
  | { ok: false; error: string };

export type MailerPort = {
  send: (input: MailerSendInput) => Promise<MailerSendResult>;
};
