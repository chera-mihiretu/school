import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  abbreviationFromIndex,
  formatPersonId,
  nextAbbreviation,
  normalizeAbbreviation,
  parsePersonId,
  personIdYearYy,
  previewPersonIds,
  validateAbbreviation,
} from "./abbreviation.ts";

describe("normalizeAbbreviation", () => {
  it("trims and uppercases", () => {
    assert.equal(normalizeAbbreviation("  aab "), "AAB");
  });
});

describe("validateAbbreviation", () => {
  it("accepts three letters after normalize", () => {
    assert.equal(validateAbbreviation("aaa"), undefined);
    assert.equal(validateAbbreviation("AbC"), undefined);
  });

  it("rejects empty, short, and non-letter codes", () => {
    assert.match(validateAbbreviation("  ") ?? "", /required/);
    assert.match(validateAbbreviation("AA") ?? "", /three letters/);
    assert.match(validateAbbreviation("A1A") ?? "", /three letters/);
    assert.match(validateAbbreviation("AAAA") ?? "", /three letters/);
  });
});

describe("abbreviationFromIndex", () => {
  it("starts at AAA and increments the last letter", () => {
    assert.equal(abbreviationFromIndex(0), "AAA");
    assert.equal(abbreviationFromIndex(1), "AAB");
    assert.equal(abbreviationFromIndex(25), "AAZ");
    assert.equal(abbreviationFromIndex(26), "ABA");
    assert.equal(abbreviationFromIndex(26 * 26 * 26 - 1), "ZZZ");
  });
});

describe("nextAbbreviation", () => {
  it("returns AAA when nothing is taken", () => {
    assert.equal(nextAbbreviation(new Set()), "AAA");
  });

  it("skips taken codes including lowercase input", () => {
    assert.equal(nextAbbreviation(new Set(["aaa", "AAB"])), "AAC");
  });

  it("wraps AAZ to ABA", () => {
    const taken = new Set<string>();
    for (let index = 0; index <= 25; index += 1) {
      taken.add(abbreviationFromIndex(index));
    }
    assert.equal(nextAbbreviation(taken), "ABA");
  });

  it("returns undefined when the space is exhausted", () => {
    const taken = new Set<string>();
    for (let index = 0; index < 26 * 26 * 26; index += 1) {
      taken.add(abbreviationFromIndex(index));
    }
    assert.equal(nextAbbreviation(taken), undefined);
  });
});

describe("formatPersonId", () => {
  it("pads five digits and concatenates T or S", () => {
    assert.equal(
      formatPersonId({
        abbreviation: "aaa",
        role: "T",
        n: 1,
        yearYy: "26",
      }),
      "AAAT/00001/26",
    );
    assert.equal(
      formatPersonId({
        abbreviation: "ABC",
        role: "S",
        n: 12,
        yearYy: "27",
      }),
      "ABCS/00012/27",
    );
    assert.equal(
      formatPersonId({
        abbreviation: "aaa",
        role: "F",
        n: 1,
        yearYy: "26",
      }),
      "AAAF/00001/26",
    );
  });
});

describe("parsePersonId", () => {
  it("reads a formatted teacher id", () => {
    assert.deepEqual(parsePersonId("AAAT/00001/26"), {
      abbreviation: "AAA",
      role: "T",
      n: 1,
      yearYy: "26",
    });
  });

  it("reads a formatted staff id", () => {
    assert.deepEqual(parsePersonId("AAAF/00001/26"), {
      abbreviation: "AAA",
      role: "F",
      n: 1,
      yearYy: "26",
    });
  });

  it("rejects a malformed id", () => {
    assert.equal(parsePersonId("AAA/00001/26"), undefined);
    assert.equal(parsePersonId("AAAT/1/26"), undefined);
  });
});

describe("previewPersonIds", () => {
  it("shows the first teacher and student numbers", () => {
    assert.deepEqual(previewPersonIds("ABC", "26"), {
      teacher: "ABCT/00001/26",
      student: "ABCS/00001/26",
      staff: "ABCF/00001/26",
    });
  });
});

describe("personIdYearYy", () => {
  it("uses the Gregorian year in Africa/Addis_Ababa", () => {
    assert.equal(
      personIdYearYy(new Date("2026-09-07T12:00:00.000Z")),
      "26",
    );
    assert.equal(
      personIdYearYy(new Date("2027-01-01T00:00:00.000Z")),
      "27",
    );
  });
});
