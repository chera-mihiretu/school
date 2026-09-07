import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  campusCredentialsMailHtml,
  campusCredentialsMailSubject,
  campusCredentialsMailText,
  readCampusHost,
  type CampusCredentialsMailInput,
} from "./campus-credentials-mail.ts";

const base = {
  schoolName: "North Hall",
  email: "member@north-hall.et",
  password: "temp-password-16x",
  loginUrl:
    "http://north-hall.e-school.et:3000/login?email=member%40north-hall.et",
} as const;

function mail(
  role: CampusCredentialsMailInput["role"],
  schoolId: string | null,
): CampusCredentialsMailInput {
  return { ...base, role, schoolId };
}

function assertCampusSurface(html: string): void {
  assert.match(html, /background:#f2ece0/);
  assert.match(html, /#6d1b1c/);
  assert.match(html, /#2c1a14/);
  assert.match(html, /Newsreader/);
  assert.match(html, /Spline Sans Mono/);
  assert.doesNotMatch(html, /#f1f4f7/);
  assert.doesNotMatch(html, /#2769b7/);
  assert.doesNotMatch(html, /#13161d/);
  assert.doesNotMatch(html, /Spline Sans'/);
  assert.doesNotMatch(html, /Bricolage Grotesque/);
  assert.match(html, />Continue</);
  assert.match(html, />north-hall</);
  assert.match(html, /Campus login/);
}

describe("campusCredentialsMailHtml", () => {
  it("uses the campus cream and brick letter for teachers, staff, and students", () => {
    const teacher = campusCredentialsMailHtml(mail("teacher", "AAAT/00001/26"));
    const staff = campusCredentialsMailHtml(mail("staff", "AAAF/00001/26"));
    const student = campusCredentialsMailHtml(mail("student", "AAAS/00001/26"));

    assertCampusSurface(teacher);
    assertCampusSurface(staff);
    assertCampusSurface(student);

    assert.match(teacher, /Teacher account/);
    assert.match(teacher, /A teacher account is ready\./);
    assert.match(teacher, /AAAT\/00001\/26/);
    assert.doesNotMatch(teacher, /Staff account/);
    assert.doesNotMatch(teacher, /Student account/);
    assert.doesNotMatch(teacher, /School account/);
    assert.doesNotMatch(teacher, /Welcome to the network\./);

    assert.match(staff, /Staff account/);
    assert.match(staff, /A staff account is ready\./);
    assert.match(staff, /AAAF\/00001\/26/);
    assert.doesNotMatch(staff, /Teacher account/);

    assert.match(student, /Student account/);
    assert.match(student, /A student account is ready\./);
    assert.match(student, /AAAS\/00001\/26/);
    assert.doesNotMatch(student, /Teacher account/);
  });

  it("escapes school names in the HTML body", () => {
    const html = campusCredentialsMailHtml({
      ...mail("teacher", "AAAT/00001/26"),
      schoolName: `Hall <script>alert("x")</script>`,
    });

    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /Hall &lt;script&gt;/);
  });
});

describe("campusCredentialsMailText", () => {
  it("keeps role copy and campus login", () => {
    const teacher = campusCredentialsMailText(mail("teacher", "AAAT/00001/26"));
    const student = campusCredentialsMailText(mail("student", "AAAS/00001/26"));

    assert.match(teacher, /Teacher account/);
    assert.match(teacher, /School ID: AAAT\/00001\/26/);
    assert.match(student, /Student account/);
    assert.match(student, /School ID: AAAS\/00001\/26/);
    assert.doesNotMatch(teacher, /username/i);
    assert.match(
      teacher,
      /http:\/\/north-hall\.e-school\.et:3000\/login\?email=member%40north-hall\.et/,
    );
  });

  it("omits the school ID when the account has none", () => {
    const text = campusCredentialsMailText(mail("staff", null));
    assert.doesNotMatch(text, /School ID:/);
    assert.match(text, /with this email and the temporary password/);
    assert.doesNotMatch(campusCredentialsMailHtml(mail("staff", null)), /School ID/);
  });
});

describe("campusCredentialsMailSubject", () => {
  it("names the campus role", () => {
    assert.equal(
      campusCredentialsMailSubject("teacher", "North Hall"),
      "Your teacher account at North Hall",
    );
    assert.equal(
      campusCredentialsMailSubject("staff", "North Hall"),
      "Your staff account at North Hall",
    );
    assert.equal(
      campusCredentialsMailSubject("student", "North Hall"),
      "Your student account at North Hall",
    );
  });
});

describe("readCampusHost", () => {
  it("splits the campus label from the public host", () => {
    assert.deepEqual(readCampusHost(base.loginUrl), {
      label: "north-hall",
      rest: ".e-school.et:3000",
    });
  });
});
