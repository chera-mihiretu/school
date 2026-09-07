export type PlatformAdminCredentialsPort = {
  verify: (email: string, password: string) => Promise<boolean>;
};
