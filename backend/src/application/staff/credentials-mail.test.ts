import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  readCampusHost,
  staffCredentialsMailHtml,
  staffCredentialsMailText,
} from "./credentials-mail.ts";

const mail = {
  schoolName: "North Hall",
  email: "hana@north-hall.et",
  password: "temp-password-16x",
  loginUrl:
    "http://north-hall.e-school.et:3000/login?email=hana%40north-hall.et",
  schoolId: "AAAF/00001/26",
};

describe("staffCredentialsMailHtml", () => {
  it("uses the campus cream letter, not the admin console letter", () => {
    const html = staffCredentialsMailHtml(mail);

    assert.match(html, /background:#f2ece0/);
    assert.match(html, /#6d1b1c/);
    assert.match(html, /Newsreader/);
    assert.doesNotMatch(html, /#f1f4f7/);
    assert.doesNotMatch(html, /#2769b7/);
    assert.doesNotMatch(html, /#13161d/);
    assert.match(html, /Staff account/);
    assert.match(html, /A staff account is ready\./);
    assert.doesNotMatch(html, /Teacher account/);
    assert.doesNotMatch(html, /choose a username/i);
    assert.doesNotMatch(html, /Welcome to the network\./);
    assert.match(html, />Continue</);
    assert.match(
      html,
      /http:\/\/north-hall\.e-school\.et:3000\/login\?email=hana%40north-hall\.et/,
    );
    assert.match(html, /temp-password-16x/);
    assert.match(html, /North Hall/);
    assert.match(html, /AAAF\/00001\/26/);
    assert.match(html, /email or school ID/);
  });

  it("escapes school names in the HTML body", () => {
    const html = staffCredentialsMailHtml({
      ...mail,
      schoolName: `Hall <script>alert("x")</script>`,
    });

    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /Hall &lt;script&gt;/);
  });
});

describe("staffCredentialsMailText", () => {
  it("points at the campus login and omits username copy", () => {
    const text = staffCredentialsMailText(mail);
    assert.match(text, /Staff account/);
    assert.doesNotMatch(text, /Teacher account/);
    assert.doesNotMatch(text, /username/i);
    assert.match(
      text,
      /http:\/\/north-hall\.e-school\.et:3000\/login\?email=hana%40north-hall\.et/,
    );
    assert.match(text, /School ID: AAAF\/00001\/26/);
    assert.match(text, /email or school ID/);
  });

  it("omits the school ID when the staff member has none", () => {
    const text = staffCredentialsMailText({ ...mail, schoolId: null });
    assert.doesNotMatch(text, /School ID:/);
    assert.match(text, /with this email and the temporary password/);
    assert.doesNotMatch(
      staffCredentialsMailHtml({ ...mail, schoolId: null }),
      /School ID/,
    );
  });
});

describe("readCampusHost", () => {
  it("splits the campus label from the public host", () => {
    assert.deepEqual(readCampusHost(mail.loginUrl), {
      label: "north-hall",
      rest: ".e-school.et:3000",
    });
  });
});
