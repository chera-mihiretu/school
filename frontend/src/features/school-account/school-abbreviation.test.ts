import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeAbbreviationDraft,
  parseAbbreviationLookup,
  parseAbbreviationPreview,
  parseClaimedAbbreviation,
} from "./school-abbreviation.ts";

describe("normalizeAbbreviationDraft", () => {
  it("keeps three uppercase letters", () => {
    assert.equal(normalizeAbbreviationDraft(" ab1c "), "ABC");
    assert.equal(normalizeAbbreviationDraft("aa"), "AA");
  });
});

describe("parseAbbreviationPreview", () => {
  it("reads a suggested unlocked preview", () => {
    const parsed = parseAbbreviationPreview({
      abbreviation: null,
      locked: false,
      suggested: "AAA",
      examples: {
        teacher: "AAAT/00001/26",
        student: "AAAS/00001/26",
        staff: "AAAF/00001/26",
      },
    });
    assert.deepEqual(parsed, {
      abbreviation: null,
      locked: false,
      suggested: "AAA",
      examples: {
        teacher: "AAAT/00001/26",
        student: "AAAS/00001/26",
        staff: "AAAF/00001/26",
      },
    });
  });

  it("reads a locked preview", () => {
    const parsed = parseAbbreviationPreview({
      abbreviation: "AAB",
      locked: true,
      suggested: "AAB",
      examples: { teacher: "AABT/00001/26", student: "AABS/00001/26" },
    });
    assert.ok(parsed);
    assert.equal(parsed.locked, true);
    assert.equal(parsed.abbreviation, "AAB");
  });
});

describe("parseAbbreviationLookup", () => {
  it("reads available and taken", () => {
    assert.deepEqual(parseAbbreviationLookup({ available: true, abbreviation: "AAA" }), {
      available: true,
      abbreviation: "AAA",
    });
    assert.deepEqual(
      parseAbbreviationLookup({
        available: false,
        abbreviation: "AAA",
        reason: "taken",
      }),
      { available: false, abbreviation: "AAA", reason: "taken" },
    );
  });
});

describe("parseClaimedAbbreviation", () => {
  it("requires abbreviation, host, and slug", () => {
    assert.equal(parseClaimedAbbreviation({ abbreviation: "AAA" }), undefined);
    assert.deepEqual(
      parseClaimedAbbreviation({
        abbreviation: "AAA",
        host: "north-hall.e-school.et",
        slug: "north-hall",
      }),
      {
        abbreviation: "AAA",
        host: "north-hall.e-school.et",
        slug: "north-hall",
      },
    );
  });
});
