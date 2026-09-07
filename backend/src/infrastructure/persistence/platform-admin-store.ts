import type { Sql } from "postgres";
import type {
  InsertFirstAdminResult,
  PlatformAdminStorePort,
} from "../../domain/ports/platform-admin-store-port.ts";

export function createPlatformAdminStore(sql: Sql): PlatformAdminStorePort {
  return {
    async ensureSchema() {
      await sql`create schema if not exists platform`;
      await sql`
        create table if not exists platform.admins (
          id uuid primary key default gen_random_uuid(),
          email text not null unique,
          password_hash text not null,
          created_at timestamptz not null default now()
        )
      `;
    },
    async insertFirstAdmin(input) {
      return sql.begin(async (tx) => {
        await tx`lock table platform.admins in exclusive mode`;
        const rows = await tx<{ exists: boolean }[]>`
          select exists(select 1 from platform.admins) as exists
        `;
        if (rows[0]?.exists === true) {
          return "exists" satisfies InsertFirstAdminResult;
        }

        await tx`
          insert into platform.admins (email, password_hash)
          values (${input.email}, ${input.passwordHash})
        `;
        return "created" satisfies InsertFirstAdminResult;
      });
    },
    async findPasswordHashByEmail(email) {
      const rows = await sql<{ password_hash: string }[]>`
        select password_hash
        from platform.admins
        where email = ${email}
        limit 1
      `;
      return rows[0]?.password_hash;
    },
  };
}
