export type CampusAccountKind = "director" | "teacher" | "staff" | "student";

export type SchoolSessionClaims = {
  accountId: string;
  email: string;
  expiresAt: Date;
  kind?: CampusAccountKind;
};

export function isCampusAccountKind(value: string): value is CampusAccountKind {
  return (
    value === "director" ||
    value === "teacher" ||
    value === "staff" ||
    value === "student"
  );
}

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

export function isAppSetupComplete(input: {
  mustChangePassword: boolean;
  slug: string | null;
  abbreviation: string | null;
}): boolean {
  return (
    !input.mustChangePassword &&
    input.slug !== null &&
    input.abbreviation !== null
  );
}

export function schoolAccountNextStep(input: {
  mustChangePassword: boolean;
  slug: string | null;
  abbreviation: string | null;
}): SchoolAccountNextStep {
  if (input.mustChangePassword) {
    return "password";
  }
  if (input.slug === null) {
    return "username";
  }
  return "abbreviation";
}

export function toSchoolSessionView(input: {
  accountId: string;
  email: string;
  expiresAt: Date;
  mustChangePassword: boolean;
  slug: string | null;
  abbreviation: string | null;
}): SchoolSessionView {
  return {
    accountId: input.accountId,
    email: input.email,
    expiresAt: input.expiresAt.toISOString(),
    mustChangePassword: input.mustChangePassword,
    nextStep: schoolAccountNextStep({
      mustChangePassword: input.mustChangePassword,
      slug: input.slug,
      abbreviation: input.abbreviation,
    }),
  };
}
