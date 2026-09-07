import type {
  CampusAccountKind,
  SchoolSessionClaims,
} from "../school-accounts/session.ts";

export type SchoolSessionSignerPort = {
  issue: (input: {
    accountId: string;
    email: string;
    kind?: CampusAccountKind;
  }) => { token: string; expiresAt: Date };
  read: (token: string) => SchoolSessionClaims | undefined;
};
