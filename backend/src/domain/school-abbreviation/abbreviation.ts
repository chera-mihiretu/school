export type PersonIdRole = "T" | "S" | "F";

export const ABBREVIATION_PATTERN = /^[A-Z]{3}$/;
export const PERSON_ID_YEAR_PATTERN = /^\d{2}$/;
export const PERSON_ID_NUMBER_WIDTH = 5;
export const ABBREVIATION_SPACE = 26 ** 3;

export const ABBREVIATION_TAKEN = "This abbreviation is already used.";
export const ABBREVIATION_LOCKED = "This school already has an abbreviation.";
export const ABBREVIATION_EXHAUSTED = "No school abbreviations are left.";
export const ABBREVIATION_REQUIRED = "Set the school abbreviation in Settings first.";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function isPersonIdRole(value: string): value is PersonIdRole {
  return value === "T" || value === "S" || value === "F";
}

export function normalizeAbbreviation(value: string): string {
  return value.trim().toUpperCase();
}

export function validateAbbreviation(value: string): string | undefined {
  const normalized = normalizeAbbreviation(value);
  if (normalized.length === 0) {
    return "An abbreviation is required";
  }
  if (!ABBREVIATION_PATTERN.test(normalized)) {
    return "Use exactly three letters A–Z";
  }
  return undefined;
}

export function isSchoolAbbreviation(value: string): boolean {
  return ABBREVIATION_PATTERN.test(normalizeAbbreviation(value));
}

export function abbreviationFromIndex(index: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= ABBREVIATION_SPACE) {
    throw new RangeError("abbreviation index is out of range");
  }

  let remaining = index;
  let code = "";
  for (let position = 0; position < 3; position += 1) {
    code = LETTERS[remaining % 26] + code;
    remaining = Math.floor(remaining / 26);
  }
  return code;
}

export function nextAbbreviation(
  taken: ReadonlySet<string>,
): string | undefined {
  const owned = new Set<string>();
  for (const value of taken) {
    const normalized = normalizeAbbreviation(value);
    if (ABBREVIATION_PATTERN.test(normalized)) {
      owned.add(normalized);
    }
  }

  for (let index = 0; index < ABBREVIATION_SPACE; index += 1) {
    const code = abbreviationFromIndex(index);
    if (!owned.has(code)) {
      return code;
    }
  }
  return undefined;
}

export function personIdYearYy(
  at: Date,
  timeZone = "Africa/Addis_Ababa",
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
  }).formatToParts(at);
  const year = parts.find((part) => part.type === "year")?.value;
  if (year === undefined || year.length < 2) {
    throw new Error("could not read calendar year");
  }
  return year.slice(-2);
}

export type FormatPersonIdInput = {
  abbreviation: string;
  role: PersonIdRole;
  n: number;
  yearYy: string;
};

export type ParsedPersonId = {
  abbreviation: string;
  role: PersonIdRole;
  n: number;
  yearYy: string;
};

export function formatPersonId(input: FormatPersonIdInput): string {
  const abbreviation = normalizeAbbreviation(input.abbreviation);
  if (!ABBREVIATION_PATTERN.test(abbreviation)) {
    throw new Error("invalid school abbreviation");
  }
  if (!Number.isInteger(input.n) || input.n < 1) {
    throw new Error("person id number must be a positive integer");
  }
  if (!PERSON_ID_YEAR_PATTERN.test(input.yearYy)) {
    throw new Error("person id year must be two digits");
  }

  const padded = String(input.n).padStart(PERSON_ID_NUMBER_WIDTH, "0");
  switch (input.role) {
    case "T":
      return `${abbreviation}T/${padded}/${input.yearYy}`;
    case "S":
      return `${abbreviation}S/${padded}/${input.yearYy}`;
    case "F":
      return `${abbreviation}F/${padded}/${input.yearYy}`;
    default: {
      const _never: never = input.role;
      return _never;
    }
  }
}

const PERSON_ID_PATTERN = /^([A-Z]{3})([TSF])\/(\d{5})\/(\d{2})$/;

export function parsePersonId(value: string): ParsedPersonId | undefined {
  const match = PERSON_ID_PATTERN.exec(value.trim().toUpperCase());
  if (match === null) {
    return undefined;
  }
  const abbreviation = match[1];
  const role = match[2];
  const nRaw = match[3];
  const yearYy = match[4];
  if (
    abbreviation === undefined ||
    role === undefined ||
    nRaw === undefined ||
    yearYy === undefined ||
    !isPersonIdRole(role)
  ) {
    return undefined;
  }
  const n = Number.parseInt(nRaw, 10);
  if (!Number.isInteger(n)) {
    return undefined;
  }
  return { abbreviation, role, n, yearYy };
}

export function previewPersonIds(
  abbreviation: string,
  yearYy: string,
): { teacher: string; student: string; staff: string } {
  return {
    teacher: formatPersonId({ abbreviation, role: "T", n: 1, yearYy }),
    student: formatPersonId({ abbreviation, role: "S", n: 1, yearYy }),
    staff: formatPersonId({ abbreviation, role: "F", n: 1, yearYy }),
  };
}
