export type AbbreviationLookupReason = "invalid" | "taken";

export type AbbreviationLookup =
  | { available: true; abbreviation: string }
  | { available: false; abbreviation: string; reason: AbbreviationLookupReason };

export type AbbreviationExamples = {
  teacher: string;
  student: string;
  staff?: string;
};

export type AbbreviationPreview = {
  abbreviation: string | null;
  locked: boolean;
  suggested: string | null;
  examples: AbbreviationExamples | null;
  lookup?: AbbreviationLookup;
};

export type ClaimedAbbreviation = {
  abbreviation: string;
  host: string;
  slug: string;
};

function readString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }
  return value;
}

export function parseAbbreviationLookup(
  value: unknown,
): AbbreviationLookup | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const abbreviation = readString(record, "abbreviation") ?? "";
  if (record.available === true) {
    return { available: true, abbreviation };
  }
  if (record.available !== false) {
    return undefined;
  }
  const reason = record.reason;
  if (reason !== "invalid" && reason !== "taken") {
    return undefined;
  }
  return { available: false, abbreviation, reason };
}

export function parseAbbreviationPreview(
  value: unknown,
): AbbreviationPreview | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const abbreviation =
    typeof record.abbreviation === "string" && record.abbreviation.length > 0
      ? record.abbreviation
      : null;
  const suggested =
    typeof record.suggested === "string" && record.suggested.length > 0
      ? record.suggested
      : null;
  let examples: AbbreviationExamples | null = null;
  if (record.examples !== null && typeof record.examples === "object") {
    const raw = record.examples as Record<string, unknown>;
    const teacher = readString(raw, "teacher");
    const student = readString(raw, "student");
    const staff = readString(raw, "staff");
    if (teacher !== undefined && student !== undefined) {
      examples = {
        teacher,
        student,
        ...(staff !== undefined ? { staff } : {}),
      };
    }
  }
  const lookup =
    record.lookup === undefined
      ? undefined
      : parseAbbreviationLookup(record.lookup);
  return {
    abbreviation,
    locked: record.locked === true,
    suggested,
    examples,
    ...(lookup !== undefined ? { lookup } : {}),
  };
}

export function parseClaimedAbbreviation(
  value: unknown,
): ClaimedAbbreviation | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const abbreviation = readString(record, "abbreviation");
  const host = readString(record, "host");
  const slug = readString(record, "slug");
  if (
    abbreviation === undefined ||
    host === undefined ||
    slug === undefined
  ) {
    return undefined;
  }
  return { abbreviation, host, slug };
}

export function normalizeAbbreviationDraft(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
}
