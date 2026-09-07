export type CredentialsMailInput = {
  schoolName: string;
  email: string;
  password: string;
  firstLoginUrl: string;
};

const CANVAS = "#f1f4f7";
const SURFACE = "#fafcfe";
const INK = "#141b24";
const MUTED = "#616a75";
const LINE = "#d0d5db";
const ACCENT = "#2769b7";
const PRIMARY = "#141b24";
const ON_PRIMARY = "#fafcfe";

const SANS = "'Spline Sans', 'Segoe UI', system-ui, sans-serif";
const MONO = "'Spline Sans Mono', ui-monospace, Menlo, Consolas, monospace";

export function credentialsMailSubject(schoolName: string): string {
  return `Your e-school.et account for ${schoolName}`;
}

export function credentialsMailText(input: CredentialsMailInput): string {
  return [
    `e-school.et`,
    ``,
    `School account`,
    ``,
    `Welcome to the network.`,
    ``,
    `A school account is ready for ${input.schoolName}.`,
    `Use this email and the temporary password. You will choose a lasting password next.`,
    `The director will choose a username later; it cannot be changed after that.`,
    ``,
    `Email: ${input.email}`,
    `Temporary password: ${input.password}`,
    ``,
    `First login:`,
    input.firstLoginUrl,
    ``,
    `This password is shown once. If you lose it, ask the platform operator.`,
  ].join("\n");
}

export function credentialsMailHtml(input: CredentialsMailInput): string {
  const name = escapeHtml(input.schoolName);
  const url = escapeHtml(input.firstLoginUrl);
  const host = readAppHost(input.firstLoginUrl);
  const emailBlock = credentialHtmlRow("Email", input.email, { padTop: false });
  const passwordBlock = credentialHtmlRow("Temporary password", input.password, {
    padTop: true,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>e-school.et</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Spline+Sans:wght@400;500&amp;family=Spline+Sans+Mono:wght@400;500&amp;display=swap" />
</head>
<body style="margin:0;padding:0;background:${CANVAS};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};">
    <tr>
      <td align="center" style="padding:32px 24px 64px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:${SURFACE};color:${INK};">
          <tr>
            <td height="3" style="height:3px;font-size:0;line-height:0;background:${ACCENT};">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 32px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" style="white-space:nowrap;padding:0 0 22px;border-bottom:1px solid ${LINE};">
                    ${networkMarkSvg()}
                    <span style="font-family:${MONO};font-size:13px;letter-spacing:0.02em;color:${ACCENT};font-weight:500;vertical-align:middle;">${escapeHtml(host.app)}</span><span style="font-family:${MONO};font-size:13px;letter-spacing:0.02em;color:${MUTED};vertical-align:middle;">${escapeHtml(host.rest)}</span>
                  </td>
                  <td valign="middle" align="right" style="padding:0 0 22px;border-bottom:1px solid ${LINE};font-family:${MONO};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">First login</td>
                </tr>
              </table>
              <div style="padding:36px 0 0;font-family:${MONO};font-size:10.5px;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">
                School account
              </div>
              <div style="padding:12px 0 12px;font-family:${SANS};font-size:34px;font-weight:500;line-height:1.05;letter-spacing:-0.025em;color:${INK};">
                Welcome to the network.
              </div>
              <div style="padding:0 0 32px;font-family:${SANS};font-size:14.5px;line-height:1.65;color:${MUTED};">
                A school account is ready for ${name}. Use this email and the temporary password. You will choose a lasting password next.
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};">
                ${emailBlock}${passwordBlock}
              </table>
              <div style="padding:32px 0 0;">
                <a href="${url}" style="display:inline-block;background:${PRIMARY};color:${ON_PRIMARY};font-family:${MONO};font-size:11.5px;font-weight:500;line-height:1;letter-spacing:0.14em;text-transform:uppercase;text-align:center;text-decoration:none;padding:12px 20px;">Continue</a>
              </div>
              <div style="padding:14px 0 0;font-family:${MONO};font-size:12px;line-height:1.6;letter-spacing:0.02em;word-break:break-all;color:${MUTED};">
                ${url}
              </div>
              <div style="padding:32px 0 0;font-family:${MONO};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">
                Shown once · e-school.et
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function readAppHost(firstLoginUrl: string): { app: string; rest: string } {
  try {
    const host = new URL(firstLoginUrl).host;
    const prefix = "app.";
    if (host.startsWith(prefix)) {
      return { app: "app", rest: `.${host.slice(prefix.length)}` };
    }
    return { app: host, rest: "" };
  } catch {
    return { app: "app", rest: "" };
  }
}

function credentialHtmlRow(
  label: string,
  value: string,
  options: { padTop: boolean },
): string {
  const pad = options.padTop ? "18px 0 4px" : "14px 0 4px";
  return `<tr>
                  <td style="padding:${pad};font-family:${MONO};font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:${MUTED};border-bottom:0;">
                    ${escapeHtml(label)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 14px;font-family:${MONO};font-size:14px;line-height:1.5;color:${INK};border-bottom:1px solid ${LINE};">
                    ${escapeHtml(value)}
                  </td>
                </tr>
                `;
}

function networkMarkSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 32 32" role="img" aria-hidden="true" style="display:inline-block;vertical-align:middle;margin-right:10px;">
      <g fill="${INK}" stroke="${INK}" stroke-width="2.2">
        <line x1="16" y1="12.4" x2="16" y2="7.6" />
        <line x1="19.6" y1="16" x2="24.4" y2="16" />
        <line x1="16" y1="19.6" x2="16" y2="24.4" />
        <line x1="12.4" y1="16" x2="7.6" y2="16" />
      </g>
      <g fill="${INK}">
        <rect x="12.4" y="12.4" width="7.2" height="7.2" rx="1.6" />
        <rect x="13.4" y="2.4" width="5.2" height="5.2" rx="1.2" />
        <rect x="24.4" y="13.4" width="5.2" height="5.2" rx="1.2" />
        <rect x="13.4" y="24.4" width="5.2" height="5.2" rx="1.2" />
        <rect x="2.4" y="13.4" width="5.2" height="5.2" rx="1.2" />
      </g>
    </svg>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
