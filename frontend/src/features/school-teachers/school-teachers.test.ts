import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canResendTeacherCredentials,
  normalizeEthiopianMobile,
  parseCreatedTeacherResult,
  parseTeacherAdminView,
  TEACHER_EMAIL_UNAVAILABLE,
  teacherMailStatusCopy,
  teacherSexLabel,
  toCreateTeacherInput,
  validateTeacherDraft,
} from "./school-teachers.ts";

const teacher = {
  id: "teacher-1",
  givenName: "Hana",
  fatherName: "Bekele",
  grandfatherName: "Tessema",
  displayName: "Hana Bekele Tessema",
  sex: "female" as const,
  phone: "+251911223344",
  email: "hana@north-hall.et",
  employeeId: "T-12",
  mustChangePassword: true,
  lastMailAt: "2026-09-07T08:00:00.000Z",
  lastMailOk: true,
  lastMailError: null,
  signedInAt: null,
  createdAt: "2026-09-07T08:00:00.000Z",
};

describe("normalizeEthiopianMobile", () => {
  it("accepts local 09 and 07 and E.164", () => {
    assert.equal(normalizeEthiopianMobile("0911223344"), "+251911223344");
    assert.equal(normalizeEthiopianMobile("0711223344"), "+251711223344");
    assert.equal(normalizeEthiopianMobile("+251 911 223 344"), "+251911223344");
    assert.equal(normalizeEthiopianMobile("251711223344"), "+251711223344");
    assert.equal(normalizeEthiopianMobile("911223344"), "+251911223344");
  });

  it("rejects non-Ethiopian and landline prefixes", () => {
    assert.equal(normalizeEthiopianMobile("0111223344"), undefined);
    assert.equal(normalizeEthiopianMobile("+12025550123"), undefined);
    assert.equal(normalizeEthiopianMobile(""), undefined);
  });
});

describe("validateTeacherDraft", () => {
  it("requires Ethiopian names, sex, mobile, and email", () => {
    assert.equal(
      validateTeacherDraft({
        givenName: "",
        fatherName: "Bekele",
        grandfatherName: "Tessema",
        sex: "female",
        phone: "0911223344",
        email: "hana@north-hall.et",
      }),
      "Given name is required.",
    );
    assert.equal(
      validateTeacherDraft({
        givenName: "Hana",
        fatherName: "Bekele",
        grandfatherName: "Tessema",
        sex: "",
        phone: "0911223344",
        email: "hana@north-hall.et",
      }),
      "Sex is required.",
    );
    assert.equal(
      validateTeacherDraft({
        givenName: "Hana",
        fatherName: "Bekele",
        grandfatherName: "Tessema",
        sex: "female",
        phone: "0111223344",
        email: "hana@north-hall.et",
      }),
      "Enter an Ethiopian mobile number starting with 09 or 07.",
    );
    assert.equal(
      validateTeacherDraft({
        givenName: "Hana",
        fatherName: "Bekele",
        grandfatherName: "Tessema",
        sex: "female",
        phone: "0911223344",
        email: "not-an-email",
      }),
      "A valid email is required.",
    );
    assert.equal(
      validateTeacherDraft({
        givenName: "Hana",
        fatherName: "Bekele",
        grandfatherName: "Tessema",
        sex: "female",
        phone: "0911223344",
        email: "hana@north-hall.et",
      }),
      undefined,
    );
  });
});

describe("toCreateTeacherInput", () => {
  it("normalizes phone for create", () => {
    const created = toCreateTeacherInput({
      givenName: " Hana ",
      fatherName: " Bekele ",
      grandfatherName: " Tessema ",
      sex: "female",
      phone: "0911223344",
      email: "Hana@North-Hall.et",
    });
    assert.ok(!("error" in created));
    assert.equal(created.phone, "+251911223344");
    assert.equal(created.email, "hana@north-hall.et");
  });
});

describe("teacherMailStatusCopy", () => {
  it("is honest about SMTP accept versus first sign-in", () => {
    assert.equal(
      teacherMailStatusCopy({
        signedInAt: "2026-09-07T09:00:00.000Z",
        lastMailOk: true,
        lastMailError: null,
      }),
      "Teacher signed in",
    );
    assert.equal(
      teacherMailStatusCopy({
        signedInAt: null,
        lastMailOk: true,
        lastMailError: null,
      }),
      "SMTP accepted — not proof of inbox",
    );
    assert.equal(
      teacherMailStatusCopy({
        signedInAt: null,
        lastMailOk: false,
        lastMailError: "SMTP refused the message",
      }),
      "Send failed: SMTP refused the message",
    );
    assert.equal(
      teacherMailStatusCopy({
        signedInAt: null,
        lastMailOk: null,
        lastMailError: null,
      }),
      "Not sent",
    );
  });
});

describe("canResendTeacherCredentials", () => {
  it("is only while mustChangePassword is still true", () => {
    assert.equal(canResendTeacherCredentials({ mustChangePassword: true }), true);
    assert.equal(
      canResendTeacherCredentials({ mustChangePassword: false }),
      false,
    );
  });
});

describe("parseTeacherAdminView", () => {
  it("parses a contract row and defaults missing mail fields", () => {
    const parsed = parseTeacherAdminView(teacher);
    assert.ok(parsed);
    assert.equal(parsed.displayName, "Hana Bekele Tessema");
    assert.equal(parsed.employeeId, "T-12");

    const fromCreated = parseTeacherAdminView({
      ...teacher,
      createdAt: undefined,
      created: "2026-09-07T10:00:00.000Z",
    });
    assert.ok(fromCreated);
    assert.equal(fromCreated.createdAt, "2026-09-07T10:00:00.000Z");

    const legacy = parseTeacherAdminView({
      ...teacher,
      employeeId: "",
      lastMailAt: undefined,
      lastMailOk: undefined,
      lastMailError: undefined,
      signedInAt: undefined,
    });
    assert.ok(legacy);
    assert.equal(legacy.employeeId, null);
    assert.equal(legacy.lastMailAt, null);
    assert.equal(legacy.lastMailOk, null);
    assert.equal(legacy.signedInAt, null);
  });
});

describe("parseCreatedTeacherResult", () => {
  it("requires loginUrl credentials and emailSent", () => {
    const parsed = parseCreatedTeacherResult({
      teacher,
      credentials: {
        email: "hana@north-hall.et",
        password: "temp-password-16x",
        loginUrl: "http://north-hall.e-school.et:3000/login",
      },
      emailSent: true,
    });
    assert.ok(parsed);
    assert.equal(parsed.credentials.loginUrl.includes("/login"), true);
    assert.equal(parsed.credentials.schoolId, null);
    assert.equal(
      parseCreatedTeacherResult({
        teacher,
        credentials: {
          email: "hana@north-hall.et",
          password: "temp-password-16x",
          firstLoginUrl: "http://app.e-school.et:3000/first-login",
        },
        emailSent: true,
      }),
      undefined,
    );
  });
});

describe("teacherSexLabel", () => {
  it("labels male and female", () => {
    assert.equal(teacherSexLabel("male"), "Male");
    assert.equal(teacherSexLabel("female"), "Female");
  });
});

describe("TEACHER_EMAIL_UNAVAILABLE", () => {
  it("matches the campus 409 copy", () => {
    assert.equal(TEACHER_EMAIL_UNAVAILABLE, "This email cannot be used.");
  });
});
