export type SchoolAccountNextStep = "password" | "username" | "abbreviation";

export type SchoolSessionView = {
  accountId: string;
  email: string;
  expiresAt: string;
  mustChangePassword: boolean;
  nextStep: SchoolAccountNextStep;
};

export type SchoolSignInView = SchoolSessionView & {
  token: string;
};

export type UsernameLookupReason = "invalid" | "reserved" | "taken";

export type UsernameLookup =
  | { available: true; username: string }
  | { available: false; username: string; reason: UsernameLookupReason };

export type ClaimUsernameView = {
  host: string;
  slug: string;
};

export type CampusAccountKind = "director" | "teacher" | "staff";

export type CampusSessionView = {
  accountId: string;
  email: string;
  expiresAt: string;
  slug: string;
  host: string;
  kind: CampusAccountKind;
  mustChangePassword: boolean;
};

export type CampusSignInView = CampusSessionView & {
  token: string;
};

export function parseCampusAccountKind(
  value: unknown,
): CampusAccountKind | undefined {
  if (value === "director" || value === "teacher" || value === "staff") {
    return value;
  }
  return undefined;
}

export function parseCampusSessionView(
  value: unknown,
): CampusSessionView | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.accountId !== "string" || record.accountId.length === 0) {
    return undefined;
  }
  if (typeof record.email !== "string" || record.email.length === 0) {
    return undefined;
  }
  if (typeof record.expiresAt !== "string" || record.expiresAt.length === 0) {
    return undefined;
  }
  if (typeof record.slug !== "string" || record.slug.length === 0) {
    return undefined;
  }
  if (typeof record.host !== "string" || record.host.length === 0) {
    return undefined;
  }

  const kind = parseCampusAccountKind(record.kind);
  if (kind === undefined) {
    return undefined;
  }

  return {
    accountId: record.accountId,
    email: record.email,
    expiresAt: record.expiresAt,
    slug: record.slug,
    host: record.host,
    kind,
    mustChangePassword: record.mustChangePassword === true,
  };
}

export function isCampusDirectorSession(
  session: CampusSessionView | undefined,
): session is CampusSessionView & { kind: "director" } {
  if (session === undefined) {
    return false;
  }

  switch (session.kind) {
    case "director":
      return true;
    case "teacher":
    case "staff":
      return false;
    default: {
      const _never: never = session.kind;
      return _never;
    }
  }
}

export function parseCampusSignInView(
  value: unknown,
): CampusSignInView | undefined {
  const session = parseCampusSessionView(value);
  if (session === undefined || value === null || typeof value !== "object") {
    return undefined;
  }

  const token = (value as Record<string, unknown>).token;
  if (typeof token !== "string" || token.length === 0) {
    return undefined;
  }

  return { ...session, token };
}
