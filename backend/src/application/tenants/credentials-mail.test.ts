import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  credentialsMailHtml,
  credentialsMailText,
  readAppHost,
} from "./credentials-mail.ts";

const mail = {
  schoolName: "North Hall",
  email: "head@north-hall.et",
  password: "temp-password-16x",
  firstLoginUrl:
    "http://app.e-school.et:3000/first-login?email=head%40north-hall.et",
};

describe("credentialsMailHtml", () => {
  it("matches the Schools console surface instead of the apex letter", () => {
    const html = credentialsMailHtml(mail);

    assert.match(html, /background:#f1f4f7/);
    assert.match(html, /background:#fafcfe/);
    assert.match(html, /#2769b7/);
    assert.match(html, /#141b24/);
    assert.doesNotMatch(html, /#13161d/);
    assert.doesNotMatch(html, /#f2ece0/);
    assert.doesNotMatch(html, /#5c2418/);
    assert.doesNotMatch(html, /Newsreader/);
    assert.doesNotMatch(html, /Bricolage Grotesque/);
    assert.match(html, /Spline Sans/);
    assert.match(html, /Spline Sans Mono/);
    assert.match(html, /Welcome to the network\./);
    assert.match(html, /School account/);
    assert.match(html, />Continue</);
    assert.match(html, />app</);
    assert.match(html, /\.e-school\.et:3000/);
    assert.match(html, /First login/);
    assert.match(
      html,
      /http:\/\/app\.e-school\.et:3000\/first-login\?email=head%40north-hall\.et/,
    );
    assert.match(html, /temp-password-16x/);
    assert.match(html, /North Hall/);
  });

  it("escapes school names in the HTML body", () => {
    const html = credentialsMailHtml({
      ...mail,
      schoolName: `Hall <script>alert("x")</script>`,
    });

    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /Hall &lt;script&gt;/);
  });
});

describe("credentialsMailText", () => {
  it("carries the same welcome copy and login URL", () => {
    const text = credentialsMailText(mail);
    assert.match(text, /Welcome to the network\./);
    assert.match(text, /School account/);
    assert.match(
      text,
      /http:\/\/app\.e-school\.et:3000\/first-login\?email=head%40north-hall\.et/,
    );
  });
});

describe("readAppHost", () => {
  it("splits the app label from the public host", () => {
    assert.deepEqual(readAppHost(mail.firstLoginUrl), {
      app: "app",
      rest: ".e-school.et:3000",
    });
  });

  it("falls back when the URL is not an app host", () => {
    assert.deepEqual(readAppHost("not a url"), { app: "app", rest: "" });
  });
});
