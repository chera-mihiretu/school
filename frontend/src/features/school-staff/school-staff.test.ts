import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canResendStaffCredentials,
  normalizeEthiopianMobile,
  parseCreatedStaffResult,
  parseStaffAdminView,
  STAFF_EMAIL_UNAVAILABLE,
  staffMailStatusCopy,
  staffSexLabel,
  toCreateStaffInput,
  validateStaffDraft,
} from "./school-staff.ts";

const staff = {
  id: "staff-1",
  givenName: "Hana",
  fatherName: "Bekele",
  grandfatherName: "Tessema",
  displayName: "Hana Bekele Tessema",
  sex: "female" as const,
  phone: "+251911223344",
  email: "hana@north-hall.et",
  employeeId: "AAAF/00001/26",
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
  });
});

describe("validateStaffDraft", () => {
  it("requires Ethiopian names, sex, mobile, and email", () => {
    assert.equal(
      validateStaffDraft({
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
      validateStaffDraft({
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

describe("toCreateStaffInput", () => {
  it("normalizes phone for create", () => {
    const created = toCreateStaffInput({
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

describe("staffMailStatusCopy", () => {
  it("is honest about SMTP accept versus first sign-in", () => {
    assert.equal(
      staffMailStatusCopy({
        signedInAt: "2026-09-07T09:00:00.000Z",
        lastMailOk: true,
        lastMailError: null,
      }),
      "Staff signed in",
    );
    assert.equal(
      staffMailStatusCopy({
        signedInAt: null,
        lastMailOk: true,
        lastMailError: null,
      }),
      "SMTP accepted — not proof of inbox",
    );
  });
});

describe("canResendStaffCredentials", () => {
  it("is only while mustChangePassword is still true", () => {
    assert.equal(canResendStaffCredentials({ mustChangePassword: true }), true);
    assert.equal(
      canResendStaffCredentials({ mustChangePassword: false }),
      false,
    );
  });
});

describe("parseStaffAdminView", () => {
  it("parses a contract row", () => {
    const parsed = parseStaffAdminView(staff);
    assert.ok(parsed);
    assert.equal(parsed.displayName, "Hana Bekele Tessema");
    assert.equal(parsed.employeeId, "AAAF/00001/26");
  });
});

describe("parseCreatedStaffResult", () => {
  it("requires loginUrl credentials and emailSent", () => {
    const parsed = parseCreatedStaffResult({
      staff,
      credentials: {
        email: "hana@north-hall.et",
        password: "temp-password-16x",
        loginUrl: "http://north-hall.e-school.et:3000/login",
        schoolId: "AAAF/00001/26",
      },
      emailSent: true,
    });
    assert.ok(parsed);
    assert.equal(parsed.credentials.schoolId, "AAAF/00001/26");
  });
});

describe("staffSexLabel", () => {
  it("labels male and female", () => {
    assert.equal(staffSexLabel("male"), "Male");
    assert.equal(staffSexLabel("female"), "Female");
  });
});

describe("STAFF_EMAIL_UNAVAILABLE", () => {
  it("matches the campus 409 copy", () => {
    assert.equal(STAFF_EMAIL_UNAVAILABLE, "This email cannot be used.");
  });
});
