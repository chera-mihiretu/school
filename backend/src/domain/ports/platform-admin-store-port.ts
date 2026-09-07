export type InsertFirstAdminResult = "created" | "exists";

export type PlatformAdminStorePort = {
  ensureSchema: () => Promise<void>;
  insertFirstAdmin: (input: {
    email: string;
    passwordHash: string;
  }) => Promise<InsertFirstAdminResult>;
  findPasswordHashByEmail: (email: string) => Promise<string | undefined>;
};
