import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isValidSchoolSlug,
  parsePublicSchoolView,
  resolvePublicSchoolView,
  schoolMonogram,
  slugifySchoolName,
  type NetworkSchool,
} from "./network.ts";

const SAMPLE_SCHOOLS: NetworkSchool[] = [
  {
    id: "1",
    name: "North Hall",
    slug: "north-hall",
    created: "2024-08-12",
    status: "active",
    founded: "Founded 1908",
  },
  {
    id: "2",
    name: "River Oak Day School",
    slug: "river-oak",
    created: "2025-03-21",
    status: "suspended",
    founded: "Founded 1974",
  },
];

describe("slugifySchoolName", () => {
  it("builds a lowercase hyphenated slug", () => {
    assert.equal(slugifySchoolName("North Hall"), "north-hall");
    assert.equal(slugifySchoolName("  Maple  Grove! "), "maple-grove");
  });
});

describe("isValidSchoolSlug", () => {
  it("accepts labels that start and end with a letter or number", () => {
    assert.equal(isValidSchoolSlug("north-hall"), true);
    assert.equal(isValidSchoolSlug("a"), true);
    assert.equal(isValidSchoolSlug("-north"), false);
    assert.equal(isValidSchoolSlug("North"), false);
  });
});

describe("schoolMonogram", () => {
  it("takes the first letter of the first two words", () => {
    assert.equal(schoolMonogram("North Hall"), "NH");
    assert.equal(schoolMonogram("Bellweather"), "B");
  });
});

describe("resolvePublicSchoolView", () => {
  it("returns the network home on the apex", () => {
    const view = resolvePublicSchoolView({
      hostname: "e-school.et",
      rootHost: "e-school.et",
      subdomain: null,
      isApex: true,
    });
    assert.equal(view.kind, "apex");
  });

  it("returns a campus for an active slug", () => {
    const view = resolvePublicSchoolView({
      hostname: "north-hall.e-school.et",
      rootHost: "e-school.et",
      subdomain: "north-hall",
      isApex: false,
      schools: SAMPLE_SCHOOLS,
    });
    assert.equal(view.kind, "campus");
    if (view.kind === "campus") {
      assert.equal(view.name, "North Hall");
      assert.equal(view.monogram, "NH");
    }
  });

  it("returns suspended for a paused campus", () => {
    const view = resolvePublicSchoolView({
      hostname: "river-oak.e-school.et",
      rootHost: "e-school.et",
      subdomain: "river-oak",
      isApex: false,
      schools: SAMPLE_SCHOOLS,
    });
    assert.equal(view.kind, "suspended");
  });

  it("returns the operator landing on the admin host", () => {
    const view = resolvePublicSchoolView({
      hostname: "admin.e-school.et",
      rootHost: "e-school.et",
      subdomain: null,
      isApex: false,
    });
    assert.equal(view.kind, "admin");
  });

  it("returns the public app host before reserved-slug unknown", () => {
    const view = resolvePublicSchoolView({
      hostname: "app.e-school.et",
      rootHost: "e-school.et",
      subdomain: null,
      isApex: false,
    });
    assert.equal(view.kind, "app");
    if (view.kind === "app") {
      assert.equal(view.host, "app.e-school.et");
      assert.equal(view.rootHost, "e-school.et");
    }
  });

  it("returns unknown when the slug is not a school", () => {
    const view = resolvePublicSchoolView({
      hostname: "maple-ridge.e-school.et",
      rootHost: "e-school.et",
      subdomain: "maple-ridge",
      isApex: false,
      schools: SAMPLE_SCHOOLS,
    });
    assert.equal(view.kind, "unknown");
  });

  it("returns the network home on localhost during local development", () => {
    const view = resolvePublicSchoolView({
      hostname: "localhost",
      rootHost: "e-school.et",
      subdomain: null,
      isApex: false,
    });
    assert.equal(view.kind, "apex");
  });
});

describe("parsePublicSchoolView", () => {
  it("accepts the admin landing payload", () => {
    const view = parsePublicSchoolView({
      kind: "admin",
      host: "admin.e-school.et",
      rootHost: "e-school.et",
    });
    assert.equal(view?.kind, "admin");
  });

  it("accepts the app landing payload", () => {
    const view = parsePublicSchoolView({
      kind: "app",
      host: "app.e-school.et",
      rootHost: "e-school.et",
    });
    assert.equal(view?.kind, "app");
  });
});
