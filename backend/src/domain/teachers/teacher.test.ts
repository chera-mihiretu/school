import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeEthiopianMobile,
  normalizePersonName,
  teacherDisplayName,
  validateEmployeeId,
  validateEthiopianMobile,
  validatePersonName,
  validateTeacherEmail,
  validateTeacherSex,
} from "./teacher.ts";

describe("normalizePersonName", () => {
  it("trims and collapses inner whitespace", () => {
    assert.equal(normalizePersonName("  Abebe   Bekele  "), "Abebe Bekele");
  });
});

describe("validatePersonName", () => {
  it("rejects empty and overly long names", () => {
    assert.equal(validatePersonName("", "Given name"), "Given name is required");
    assert.equal(validatePersonName("   ", "Given name"), "Given name is required");
    assert.match(
      validatePersonName("A".repeat(81), "Given name") ?? "",
      /too long/,
    );
    assert.equal(validatePersonName("Abebe", "Given name"), undefined);
  });
});

describe("validateTeacherSex", () => {
  it("accepts only male or female", () => {
    assert.equal(validateTeacherSex("male"), undefined);
    assert.equal(validateTeacherSex("female"), undefined);
    assert.equal(validateTeacherSex("other"), "Sex must be male or female");
    assert.equal(validateTeacherSex("Male"), "Sex must be male or female");
  });
});

describe("normalizeEthiopianMobile", () => {
  it("accepts local and E.164 Ethiopian mobiles and stores E.164", () => {
    assert.equal(normalizeEthiopianMobile("0912345678"), "+251912345678");
    assert.equal(normalizeEthiopianMobile("0712345678"), "+251712345678");
    assert.equal(normalizeEthiopianMobile("912345678"), "+251912345678");
    assert.equal(normalizeEthiopianMobile("712345678"), "+251712345678");
    assert.equal(normalizeEthiopianMobile("+251912345678"), "+251912345678");
    assert.equal(normalizeEthiopianMobile("+251712345678"), "+251712345678");
    assert.equal(normalizeEthiopianMobile("09 123 456 78"), "+251912345678");
    assert.equal(normalizeEthiopianMobile("+251 9 1234 5678"), "+251912345678");
  });

  it("rejects landlines and foreign numbers", () => {
    assert.equal(normalizeEthiopianMobile("0111234567"), undefined);
    assert.equal(normalizeEthiopianMobile("+251111234567"), undefined);
    assert.equal(normalizeEthiopianMobile("+14155552671"), undefined);
    assert.equal(normalizeEthiopianMobile("0812345678"), undefined);
    assert.equal(normalizeEthiopianMobile(""), undefined);
  });
});

describe("validateEthiopianMobile", () => {
  it("requires a value and a valid mobile", () => {
    assert.equal(validateEthiopianMobile(""), "Phone is required");
    assert.equal(validateEthiopianMobile("   "), "Phone is required");
    assert.equal(
      validateEthiopianMobile("0111234567"),
      "A valid Ethiopian mobile number is required",
    );
    assert.equal(validateEthiopianMobile("0912345678"), undefined);
  });
});

describe("validateTeacherEmail", () => {
  it("reuses tenant email rules", () => {
    assert.equal(validateTeacherEmail(""), "Email is required");
    assert.equal(validateTeacherEmail("not-an-email"), "A valid email is required");
    assert.equal(validateTeacherEmail("  Teacher@School.et "), undefined);
  });
});

describe("validateEmployeeId", () => {
  it("allows missing ids and rejects long ones", () => {
    assert.equal(validateEmployeeId(null), undefined);
    assert.equal(validateEmployeeId("T-12"), undefined);
    assert.match(validateEmployeeId("E".repeat(65)) ?? "", /too long/);
  });
});

describe("teacherDisplayName", () => {
  it("joins given, father, and grandfather names", () => {
    assert.equal(
      teacherDisplayName({
        givenName: "Abebe",
        fatherName: "Bekele",
        grandfatherName: "Tesfaye",
      }),
      "Abebe Bekele Tesfaye",
    );
  });
});
