export type SessionClaims = {
  email: string;
  expiresAt: Date;
};

export type SessionSignerPort = {
  issue: (email: string) => { token: string; expiresAt: Date };
  read: (token: string) => SessionClaims | undefined;
};
