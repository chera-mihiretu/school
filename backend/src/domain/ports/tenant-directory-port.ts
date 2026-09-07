export type TenantStatus = "pending_setup" | "active" | "suspended";

export type TenantDirectoryEntry = {
  name: string;
  slug: string;
  status: TenantStatus;
  founded: string;
};

export type TenantDirectoryPort = {
  findBySlug(slug: string): Promise<TenantDirectoryEntry | undefined>;
};
