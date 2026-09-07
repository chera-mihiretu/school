import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  studentCredentialsMailHtml,
  studentCredentialsMailSubject,
  studentCredentialsMailText,
} from "./credentials-mail.ts";

const mail = {
  schoolName: "North Hall",
  email: "lidya@north-hall.et",
  password: "temp-password-16x",
  loginUrl:
    "http://north-hall.e-school.et:3000/login?email=lidya%40north-hall.et",
  schoolId: "AAAS/00001/26",
};

describe("studentCredentialsMailHtml", () => {
  it("uses the campus cream letter with student copy", () => {
    const html = studentCredentialsMailHtml(mail);

    assert.match(html, /background:#f2ece0/);
    assert.match(html, /#6d1b1c/);
    assert.match(html, /Newsreader/);
    assert.doesNotMatch(html, /#f1f4f7/);
    assert.doesNotMatch(html, /#2769b7/);
    assert.match(html, /Student account/);
    assert.match(html, /A student account is ready\./);
    assert.match(html, /AAAS\/00001\/26/);
    assert.doesNotMatch(html, /Teacher account/);
    assert.doesNotMatch(html, /Welcome to the network\./);
    assert.equal(
      studentCredentialsMailSubject("North Hall"),
      "Your student account at North Hall",
    );
    assert.match(studentCredentialsMailText(mail), /Student account/);
  });
});
