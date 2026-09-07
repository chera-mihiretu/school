export type CampusCredentialsMailRole = "teacher" | "staff" | "student";

export type CampusCredentialsMailInput = {
  role: CampusCredentialsMailRole;
  schoolName: string;
  email: string;
  password: string;
  loginUrl: string;
  schoolId: string | null;
};

const CANVAS = "#f2ece0";
const INK = "#2c1a14";
const MUTED = "#7c6354";
const BODY = "#503e35";
const LINE = "#dad0bf";
const BRICK = "#6d1b1c";
const ON_BRICK = "#f6f1e7";

const SERIF = "Newsreader, Georgia, 'Times New Roman', serif";
const MONO = "'Spline Sans Mono', ui-monospace, Menlo, Consolas, monospace";

type CampusMailCopy = {
  kicker: string;
  headline: string;
  howWithId: string;
  howWithoutId: string;
  ask: string;
};

export function campusCredentialsMailSubject(
  role: CampusCredentialsMailRole,
  schoolName: string,
): string {
  switch (role) {
    case "teacher":
      return `Your teacher account at ${schoolName}`;
    case "staff":
      return `Your staff account at ${schoolName}`;
    case "student":
      return `Your student account at ${schoolName}`;
    default: {
      const _never: never = role;
      return _never;
    }
  }
}

export function campusCredentialsMailText(
  input: CampusCredentialsMailInput,
): string {
  const copy = campusMailCopy(input.role);
  const how =
    input.schoolId !== null && input.schoolId.length > 0
      ? copy.howWithId
      : copy.howWithoutId;
  const schoolIdLines =
    input.schoolId !== null && input.schoolId.length > 0
      ? [`School ID: ${input.schoolId}`]
      : [];

  return [
    `e-school.et`,
    ``,
    copy.kicker,
    ``,
    copy.headline,
    ``,
    `You can sign in at ${input.schoolName} ${how}.`,
    `You will choose a lasting password the first time you sign in on campus.`,
    ``,
    ...schoolIdLines,
    `Email: ${input.email}`,
    `Temporary password: ${input.password}`,
    ``,
    `Campus login:`,
    input.loginUrl,
    ``,
    `This password is shown once. If you lose it, ${copy.ask}.`,
  ].join("\n");
}

export function campusCredentialsMailHtml(
  input: CampusCredentialsMailInput,
): string {
  const copy = campusMailCopy(input.role);
  const name = escapeHtml(input.schoolName);
  const url = escapeHtml(input.loginUrl);
  const host = readCampusHost(input.loginUrl);
  const how =
    input.schoolId !== null && input.schoolId.length > 0
      ? copy.howWithId
      : copy.howWithoutId;
  const schoolIdBlock =
    input.schoolId !== null && input.schoolId.length > 0
      ? credentialHtmlRow("School ID", input.schoolId, { padTop: false })
      : "";
  const emailBlock = credentialHtmlRow("Email", input.email, {
    padTop: schoolIdBlock.length > 0,
  });
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
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:wght@400;500&amp;family=Spline+Sans+Mono:wght@400;500&amp;display=swap" />
</head>
<body style="margin:0;padding:0;background:${CANVAS};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};">
    <tr>
      <td align="center" style="padding:32px 24px 64px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:${CANVAS};color:${INK};">
          <tr>
            <td height="3" style="height:3px;font-size:0;line-height:0;background:${BRICK};">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 0 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" style="white-space:nowrap;padding:0 0 22px;border-bottom:1px solid ${LINE};">
                    ${networkMarkSvg()}
                    <span style="font-family:${MONO};font-size:13px;letter-spacing:0.02em;color:${INK};font-weight:500;vertical-align:middle;">${escapeHtml(host.label)}</span><span style="font-family:${MONO};font-size:13px;letter-spacing:0.02em;color:${MUTED};vertical-align:middle;">${escapeHtml(host.rest)}</span>
                  </td>
                  <td valign="middle" align="right" style="padding:0 0 22px;border-bottom:1px solid ${LINE};font-family:${MONO};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${BRICK};">Campus login</td>
                </tr>
              </table>
              <div style="padding:36px 0 0;font-family:${MONO};font-size:10.5px;letter-spacing:0.16em;text-transform:uppercase;color:${BRICK};">
                ${escapeHtml(copy.kicker)}
              </div>
              <div style="padding:12px 0 12px;font-family:${SERIF};font-size:34px;font-weight:500;line-height:1.05;letter-spacing:-0.025em;color:${INK};">
                ${escapeHtml(copy.headline)}
              </div>
              <div style="padding:0 0 32px;font-family:${SERIF};font-size:15px;line-height:1.65;color:${BODY};">
                You can sign in at ${name} ${how}. You will choose a lasting password the first time you sign in on campus.
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};">
                ${schoolIdBlock}${emailBlock}${passwordBlock}
              </table>
              <div style="padding:32px 0 0;">
                <a href="${url}" style="display:inline-block;background:${BRICK};color:${ON_BRICK};font-family:${MONO};font-size:11.5px;font-weight:500;line-height:1;letter-spacing:0.14em;text-transform:uppercase;text-align:center;text-decoration:none;padding:12px 20px;">Continue</a>
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

export function readCampusHost(loginUrl: string): { label: string; rest: string } {
  try {
    const host = new URL(loginUrl).host;
    const dot = host.indexOf(".");
    if (dot > 0) {
      return { label: host.slice(0, dot), rest: host.slice(dot) };
    }
    return { label: host, rest: "" };
  } catch {
    return { label: "campus", rest: "" };
  }
}

function campusMailCopy(role: CampusCredentialsMailRole): CampusMailCopy {
  switch (role) {
    case "teacher":
      return {
        kicker: "Teacher account",
        headline: "A teacher account is ready.",
        howWithId: "with this email or school ID and the temporary password",
        howWithoutId: "with this email and the temporary password",
        ask: "ask your school director",
      };
    case "staff":
      return {
        kicker: "Staff account",
        headline: "A staff account is ready.",
        howWithId: "with this email or school ID and the temporary password",
        howWithoutId: "with this email and the temporary password",
        ask: "ask your school director",
      };
    case "student":
      return {
        kicker: "Student account",
        headline: "A student account is ready.",
        howWithId: "with this email or school ID and the temporary password",
        howWithoutId: "with this email and the temporary password",
        ask: "ask your school director",
      };
    default: {
      const _never: never = role;
      return _never;
    }
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
