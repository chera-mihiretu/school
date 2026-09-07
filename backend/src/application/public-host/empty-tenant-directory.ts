import type { TenantDirectoryPort } from "../../domain/ports/tenant-directory-port.ts";

export function createEmptyTenantDirectory(): TenantDirectoryPort {
  return {
    async findBySlug() {
      return undefined;
    },
  };
}
