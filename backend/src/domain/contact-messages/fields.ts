const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SHORT_TEXT = 200;
const MAX_NOTE = 4000;

export function normalizeContactEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeContactText(value: string): string {
  return value.trim();
}

export function normalizeOptionalContactText(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function validateContactSchool(school: string): string | undefined {
  if (school.length === 0) {
    return "School name is required";
  }
  if (school.length > MAX_SHORT_TEXT) {
    return "School name is too long";
  }
  return undefined;
}

export function validateContactName(name: string): string | undefined {
  if (name.length === 0) {
    return "Name is required";
  }
  if (name.length > MAX_SHORT_TEXT) {
    return "Name is too long";
  }
  return undefined;
}

export function validateContactEmail(email: string): string | undefined {
  if (email.length === 0) {
    return "Email is required";
  }
  if (!EMAIL_PATTERN.test(email)) {
    return "A valid email is required";
  }
  return undefined;
}

export function validateContactRole(role: string | null): string | undefined {
  if (role !== null && role.length > MAX_SHORT_TEXT) {
    return "Role is too long";
  }
  return undefined;
}

export function validateContactNote(note: string): string | undefined {
  if (note.length > MAX_NOTE) {
    return "Note is too long";
  }
  return undefined;
}
