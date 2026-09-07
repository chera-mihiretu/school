import type { Sql, TransactionSql } from "postgres";

type Queryable = Sql | TransactionSql;
import type { TenantStatus } from "../../domain/ports/tenant-directory-port.ts";
import type { TenantStorePort } from "../../domain/ports/tenant-store-port.ts";
import { tenantSchemaName } from "../../domain/school-slug.ts";
import { ensureTenantTeachersTable } from "./tenant-teachers-schema.ts";
import {
  backfillDashboardStats,
  emptyDashboardStats,
  recordSchoolCreated,
  recordStatusChange,
  type DashboardNewestSchool,
  type DashboardStats,
} from "../../domain/tenants/dashboard-stats.ts";
import {
  normalizeTenantEmail,
  type Tenant,
} from "../../domain/tenants/tenant.ts";

type TenantRow = {
  id: string;
  name: string;
  slug: string | null;
  email: string | null;
  status: TenantStatus;
  founded: string;
  created_at: Date;
  must_change_password: boolean;
  last_mail_at: Date | null;
  last_mail_ok: boolean | null;
  last_mail_error: string | null;
  signed_in_at: Date | null;
  abbreviation: string | null;
};

type TenantAuthRow = TenantRow & {
  password_hash: string | null;
};

function mapRow(row: TenantRow): Tenant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    email: row.email,
    status: row.status,
    founded: row.founded,
    createdAt: row.created_at,
    mustChangePassword: row.must_change_password,
    lastMailAt: row.last_mail_at,
    lastMailOk: row.last_mail_ok,
    lastMailError: row.last_mail_error,
    signedInAt: row.signed_in_at,
    abbreviation: row.abbreviation,
  };
}

function mapAuth(row: TenantAuthRow | undefined) {
  if (row === undefined || row.password_hash === null || row.password_hash.length === 0) {
    return undefined;
  }
  return { tenant: mapRow(row), passwordHash: row.password_hash };
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "23505"
  );
}

function isDuplicateSchema(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "42P06"
  );
}

export function createTenantStore(sql: Sql): TenantStorePort {
  return {
    async ensureSchema() {
      await sql`create schema if not exists platform`;
      await sql`
        create table if not exists platform.tenants (
          id uuid primary key default gen_random_uuid(),
          name text not null,
          slug text,
          email text,
          password_hash text,
          must_change_password boolean not null default false,
          status text not null default 'active'
            check (status in ('pending_setup', 'active', 'suspended')),
          founded text not null,
          created_at timestamptz not null default now()
        )
      `;
      await sql`alter table platform.tenants alter column slug drop not null`;
      await sql`alter table platform.tenants add column if not exists email text`;
      await sql`alter table platform.tenants add column if not exists password_hash text`;
      await sql`
        alter table platform.tenants
        add column if not exists must_change_password boolean not null default false
      `;
      await sql`alter table platform.tenants add column if not exists last_mail_at timestamptz`;
      await sql`alter table platform.tenants add column if not exists last_mail_ok boolean`;
      await sql`alter table platform.tenants add column if not exists last_mail_error text`;
      await sql`alter table platform.tenants add column if not exists signed_in_at timestamptz`;
      await sql`alter table platform.tenants add column if not exists abbreviation text`;
      await sql`
        create unique index if not exists tenants_abbreviation_key
        on platform.tenants (upper(abbreviation))
        where abbreviation is not null
      `;
      await sql.unsafe(`
        do $$
        declare
          constraint_name text;
        begin
          for constraint_name in
            select con.conname
            from pg_constraint con
            join pg_class rel on rel.oid = con.conrelid
            join pg_namespace nsp on nsp.oid = rel.relnamespace
            where nsp.nspname = 'platform'
              and rel.relname = 'tenants'
              and con.contype = 'c'
              and pg_get_constraintdef(con.oid) ilike '%status%'
          loop
            execute format(
              'alter table platform.tenants drop constraint %I',
              constraint_name
            );
          end loop;
        end $$;
      `);
      await sql`
        alter table platform.tenants
        add constraint tenants_status_check
        check (status in ('pending_setup', 'active', 'suspended'))
      `;
      await sql`
        create unique index if not exists tenants_slug_key on platform.tenants (slug)
      `;
      await sql`
        create unique index if not exists tenants_email_key on platform.tenants (email)
      `;
      await sql`
        create table if not exists platform.dashboard_stats (
          id integer primary key check (id = 1),
          school_count integer not null default 0,
          active_count integer not null default 0,
          pending_setup_count integer not null default 0,
          suspended_count integer not null default 0,
          created_by_year jsonb not null default '{}'::jsonb,
          newest jsonb not null default '[]'::jsonb,
          updated_at timestamptz not null default now()
        )
      `;
      await backfillDashboardStatsRow(sql);
    },
    async insert(input) {
      const schemaName = tenantSchemaName(input.slug);
      try {
        return await sql.begin(async (tx) => {
          const currentStats = await loadStatsForUpdate(tx);
          const rows = await tx<TenantRow[]>`
            insert into platform.tenants (name, slug, founded)
            values (${input.name}, ${input.slug}, ${input.founded})
            returning
              id,
              name,
              slug,
              email,
              status,
              founded,
              created_at,
              must_change_password,
              last_mail_at,
              last_mail_ok,
              last_mail_error,
              signed_in_at,
              abbreviation
          `;
          const row = rows[0];
          if (row === undefined) {
            throw new Error("tenant insert returned no row");
          }

          await tx`create schema ${tx(schemaName)}`;
          await ensureTenantTeachersTable(tx, input.slug);
          const tenant = mapRow(row);
          await persistStats(
            tx,
            recordSchoolCreated(currentStats, tenant, new Date()),
          );
          return { ok: true, tenant } as const;
        });
      } catch (err) {
        if (isUniqueViolation(err) || isDuplicateSchema(err)) {
          return { ok: false, reason: "slug_taken" };
        }
        throw err;
      }
    },
    async insertPending(input) {
      const email = normalizeTenantEmail(input.email);
      try {
        return await sql.begin(async (tx) => {
          const currentStats = await loadStatsForUpdate(tx);
          const rows = await tx<TenantRow[]>`
            insert into platform.tenants (
              name,
              email,
              password_hash,
              founded,
              status,
              must_change_password
            )
            values (
              ${input.name},
              ${email},
              ${input.passwordHash},
              ${input.founded},
              'pending_setup',
              true
            )
            returning
              id,
              name,
              slug,
              email,
              status,
              founded,
              created_at,
              must_change_password,
              last_mail_at,
              last_mail_ok,
              last_mail_error,
              signed_in_at,
              abbreviation
          `;
          const row = rows[0];
          if (row === undefined) {
            throw new Error("pending tenant insert returned no row");
          }
          const tenant = mapRow(row);
          await persistStats(
            tx,
            recordSchoolCreated(currentStats, tenant, new Date()),
          );
          return { ok: true, tenant } as const;
        });
      } catch (err) {
        if (isUniqueViolation(err)) {
          return { ok: false, reason: "email_taken" };
        }
        throw err;
      }
    },
    async findBySlug(slug) {
      const rows = await sql<TenantRow[]>`
        select
          id,
          name,
          slug,
          email,
          status,
          founded,
          created_at,
          must_change_password,
          last_mail_at,
          last_mail_ok,
          last_mail_error,
          signed_in_at,
          abbreviation
        from platform.tenants
        where slug is not null and slug = ${slug}
        limit 1
      `;
      const row = rows[0];
      if (row === undefined) {
        return undefined;
      }
      return mapRow(row);
    },
    async findByEmail(email) {
      const normalized = normalizeTenantEmail(email);
      const rows = await sql<TenantRow[]>`
        select
          id,
          name,
          slug,
          email,
          status,
          founded,
          created_at,
          must_change_password,
          last_mail_at,
          last_mail_ok,
          last_mail_error,
          signed_in_at,
          abbreviation
        from platform.tenants
        where email = ${normalized}
        limit 1
      `;
      const row = rows[0];
      if (row === undefined) {
        return undefined;
      }
      return mapRow(row);
    },
    async findAuthByEmail(email) {
      const normalized = normalizeTenantEmail(email);
      const rows = await sql<TenantAuthRow[]>`
        select
          id,
          name,
          slug,
          email,
          status,
          founded,
          created_at,
          must_change_password,
          last_mail_at,
          last_mail_ok,
          last_mail_error,
          signed_in_at,
          abbreviation,
          password_hash
        from platform.tenants
        where email = ${normalized}
        limit 1
      `;
      return mapAuth(rows[0]);
    },
    async findAuthById(id) {
      const rows = await sql<TenantAuthRow[]>`
        select
          id,
          name,
          slug,
          email,
          status,
          founded,
          created_at,
          must_change_password,
          last_mail_at,
          last_mail_ok,
          last_mail_error,
          signed_in_at,
          abbreviation,
          password_hash
        from platform.tenants
        where id = ${id}
        limit 1
      `;
      return mapAuth(rows[0]);
    },
    async updatePassword(input) {
      const rows = await sql<TenantRow[]>`
        update platform.tenants
        set
          password_hash = ${input.passwordHash},
          must_change_password = ${input.mustChangePassword}
        where id = ${input.id}
        returning
          id,
          name,
          slug,
          email,
          status,
          founded,
          created_at,
          must_change_password,
          last_mail_at,
          last_mail_ok,
          last_mail_error,
          signed_in_at,
          abbreviation
      `;
      const row = rows[0];
      if (row === undefined) {
        return { ok: false, reason: "not_found" };
      }
      return { ok: true, tenant: mapRow(row) };
    },
    async claimSlug(input) {
      const schemaName = tenantSchemaName(input.slug);
      try {
        return await sql.begin(async (tx) => {
          const existing = await tx<TenantRow[]>`
            select
              id,
              name,
              slug,
              email,
              status,
              founded,
              created_at,
              must_change_password,
              last_mail_at,
              last_mail_ok,
              last_mail_error,
              signed_in_at,
              abbreviation
            from platform.tenants
            where id = ${input.id}
            for update
          `;
          const current = existing[0];
          if (current === undefined) {
            return { ok: false, reason: "not_found" } as const;
          }
          if (current.slug !== null) {
            return { ok: false, reason: "already_claimed" } as const;
          }

          const taken = await tx<TenantRow[]>`
            select id
            from platform.tenants
            where slug = ${input.slug}
            limit 1
          `;
          if (taken[0] !== undefined) {
            return { ok: false, reason: "slug_taken" } as const;
          }

          const currentStats = await loadStatsForUpdate(tx);
          const rows = await tx<TenantRow[]>`
            update platform.tenants
            set slug = ${input.slug}, status = 'active'
            where id = ${input.id}
            returning
              id,
              name,
              slug,
              email,
              status,
              founded,
              created_at,
              must_change_password,
              last_mail_at,
              last_mail_ok,
              last_mail_error,
              signed_in_at,
              abbreviation
          `;
          const row = rows[0];
          if (row === undefined) {
            throw new Error("tenant claim returned no row");
          }

          await tx`create schema ${tx(schemaName)}`;
          await ensureTenantTeachersTable(tx, input.slug);
          const tenant = mapRow(row);
          await persistStats(
            tx,
            recordStatusChange(currentStats, tenant, current.status, new Date()),
          );
          return { ok: true, tenant } as const;
        });
      } catch (err) {
        if (isUniqueViolation(err) || isDuplicateSchema(err)) {
          return { ok: false, reason: "slug_taken" };
        }
        throw err;
      }
    },
    async listPaged(input) {
      const offset = (input.page - 1) * input.pageSize;
      const rows = await sql<(TenantRow & { total: number })[]>`
        select
          id,
          name,
          slug,
          email,
          status,
          founded,
          created_at,
          must_change_password,
          last_mail_at,
          last_mail_ok,
          last_mail_error,
          signed_in_at,
          abbreviation,
          count(*) over()::int as total
        from platform.tenants
        order by created_at desc, id desc
        limit ${input.pageSize}
        offset ${offset}
      `;
      return {
        items: rows.map(mapRow),
        total: rows[0]?.total ?? 0,
      };
    },
    async setStatus(id, status) {
      return sql.begin(async (tx) => {
        const existing = await tx<TenantRow[]>`
          select
            id,
            name,
            slug,
            email,
            status,
            founded,
            created_at,
            must_change_password,
            last_mail_at,
            last_mail_ok,
            last_mail_error,
            signed_in_at,
            abbreviation
          from platform.tenants
          where id = ${id}
          for update
        `;
        const current = existing[0];
        if (current === undefined) {
          return { ok: false, reason: "not_found" } as const;
        }

        const currentStats = await loadStatsForUpdate(tx);
        const rows = await tx<TenantRow[]>`
          update platform.tenants
          set status = ${status}
          where id = ${id}
          returning
            id,
            name,
            slug,
            email,
            status,
            founded,
            created_at,
            must_change_password,
            last_mail_at,
            last_mail_ok,
            last_mail_error,
            signed_in_at,
            abbreviation
        `;
        const row = rows[0];
        if (row === undefined) {
          throw new Error("tenant status update returned no row");
        }
        const tenant = mapRow(row);
        await persistStats(
          tx,
          recordStatusChange(currentStats, tenant, current.status, new Date()),
        );
        return { ok: true, tenant } as const;
      });
    },
    async recordMailAttempt(id, input) {
      const error = input.ok ? null : (input.error ?? "Failed to send email");
      const rows = await sql<TenantRow[]>`
        update platform.tenants
        set
          last_mail_at = ${input.at},
          last_mail_ok = ${input.ok},
          last_mail_error = ${error}
        where id = ${id}
        returning
          id,
          name,
          slug,
          email,
          status,
          founded,
          created_at,
          must_change_password,
          last_mail_at,
          last_mail_ok,
          last_mail_error,
          signed_in_at,
          abbreviation
      `;
      const row = rows[0];
      if (row === undefined) {
        return { ok: false, reason: "not_found" };
      }
      return { ok: true, tenant: mapRow(row) };
    },
    async listAbbreviations() {
      const rows = await sql<{ abbreviation: string }[]>`
        select abbreviation
        from platform.tenants
        where abbreviation is not null
      `;
      return rows.map((row) => row.abbreviation);
    },
    async claimAbbreviation(input) {
      try {
        return await sql.begin(async (tx) => {
          const existing = await tx<TenantRow[]>`
            select
              id,
              name,
              slug,
              email,
              status,
              founded,
              created_at,
              must_change_password,
              last_mail_at,
              last_mail_ok,
              last_mail_error,
              signed_in_at,
              abbreviation
            from platform.tenants
            where id = ${input.id}
            for update
          `;
          const current = existing[0];
          if (current === undefined) {
            return { ok: false, reason: "not_found" } as const;
          }
          if (current.abbreviation !== null) {
            return { ok: false, reason: "already_set" } as const;
          }

          const rows = await tx<TenantRow[]>`
            update platform.tenants
            set abbreviation = ${input.abbreviation}
            where id = ${input.id} and abbreviation is null
            returning
              id,
              name,
              slug,
              email,
              status,
              founded,
              created_at,
              must_change_password,
              last_mail_at,
              last_mail_ok,
              last_mail_error,
              signed_in_at,
              abbreviation
          `;
          const row = rows[0];
          if (row === undefined) {
            return { ok: false, reason: "already_set" } as const;
          }
          return { ok: true, tenant: mapRow(row) } as const;
        });
      } catch (err) {
        if (isUniqueViolation(err)) {
          return { ok: false, reason: "taken" };
        }
        throw err;
      }
    },
    async recordDirectorSignIn(id, at) {
      const rows = await sql<TenantRow[]>`
        update platform.tenants
        set signed_in_at = ${at}
        where id = ${id} and signed_in_at is null
        returning
          id,
          name,
          slug,
          email,
          status,
          founded,
          created_at,
          must_change_password,
          last_mail_at,
          last_mail_ok,
          last_mail_error,
          signed_in_at,
          abbreviation
      `;
      const row = rows[0];
      if (row !== undefined) {
        return { ok: true, tenant: mapRow(row) };
      }

      const existing = await sql<TenantRow[]>`
        select
          id,
          name,
          slug,
          email,
          status,
          founded,
          created_at,
          must_change_password,
          last_mail_at,
          last_mail_ok,
          last_mail_error,
          signed_in_at,
          abbreviation
        from platform.tenants
        where id = ${id}
        limit 1
      `;
      const current = existing[0];
      if (current === undefined) {
        return { ok: false, reason: "not_found" };
      }
      return { ok: true, tenant: mapRow(current) };
    },
    async readDashboardStats() {
      const rows = await sql<DashboardStatsRow[]>`
        select
          id,
          school_count,
          active_count,
          pending_setup_count,
          suspended_count,
          created_by_year,
          newest,
          updated_at
        from platform.dashboard_stats
        where id = 1
        limit 1
      `;
      const row = rows[0];
      if (row === undefined) {
        return emptyDashboardStats(new Date());
      }
      return mapStatsRow(row);
    },
  };
}

type DashboardStatsRow = {
  id: number;
  school_count: number;
  active_count: number;
  pending_setup_count: number;
  suspended_count: number;
  created_by_year: unknown;
  newest: unknown;
  updated_at: Date;
};

async function selectTenants(sql: Queryable): Promise<Tenant[]> {
  const rows = await sql<TenantRow[]>`
    select
      id,
      name,
      slug,
      email,
      status,
      founded,
      created_at,
      must_change_password,
      last_mail_at,
      last_mail_ok,
      last_mail_error,
      signed_in_at,
      abbreviation
    from platform.tenants
  `;
  return rows.map(mapRow);
}

async function backfillDashboardStatsRow(sql: Queryable): Promise<void> {
  const existing = await sql<{ id: number }[]>`
    select id from platform.dashboard_stats where id = 1 limit 1
  `;
  if (existing[0] !== undefined) {
    return;
  }

  const stats = backfillDashboardStats(await selectTenants(sql), new Date());
  await insertStatsRow(sql, stats);
}

async function loadStatsForUpdate(sql: Queryable): Promise<DashboardStats> {
  const rows = await sql<DashboardStatsRow[]>`
    select
      id,
      school_count,
      active_count,
      pending_setup_count,
      suspended_count,
      created_by_year,
      newest,
      updated_at
    from platform.dashboard_stats
    where id = 1
    for update
  `;
  const row = rows[0];
  if (row !== undefined) {
    return mapStatsRow(row);
  }

  const stats = backfillDashboardStats(await selectTenants(sql), new Date());
  await insertStatsRow(sql, stats);
  return stats;
}

async function insertStatsRow(sql: Queryable, stats: DashboardStats): Promise<void> {
  await sql`
    insert into platform.dashboard_stats (
      id,
      school_count,
      active_count,
      pending_setup_count,
      suspended_count,
      created_by_year,
      newest,
      updated_at
    )
    values (
      1,
      ${stats.schoolCount},
      ${stats.activeCount},
      ${stats.pendingSetupCount},
      ${stats.suspendedCount},
      ${sql.json(stats.createdByYear)},
      ${sql.json(stats.newest)},
      ${stats.updatedAt}
    )
    on conflict (id) do nothing
  `;
}

async function persistStats(sql: Queryable, stats: DashboardStats): Promise<void> {
  await sql`
    update platform.dashboard_stats
    set
      school_count = ${stats.schoolCount},
      active_count = ${stats.activeCount},
      pending_setup_count = ${stats.pendingSetupCount},
      suspended_count = ${stats.suspendedCount},
      created_by_year = ${sql.json(stats.createdByYear)},
      newest = ${sql.json(stats.newest)},
      updated_at = ${stats.updatedAt}
    where id = 1
  `;
}

function mapStatsRow(row: DashboardStatsRow): DashboardStats {
  return {
    schoolCount: row.school_count,
    activeCount: row.active_count,
    pendingSetupCount: row.pending_setup_count,
    suspendedCount: row.suspended_count,
    createdByYear: parseCreatedByYear(row.created_by_year),
    newest: parseNewest(row.newest),
    updatedAt: row.updated_at,
  };
}

function parseCreatedByYear(value: unknown): Record<string, number> {
  const record =
    typeof value === "string"
      ? (JSON.parse(value) as unknown)
      : value;
  if (record === null || typeof record !== "object" || Array.isArray(record)) {
    return {};
  }

  const createdByYear: Record<string, number> = {};
  for (const [year, count] of Object.entries(record)) {
    if (typeof count === "number" && Number.isFinite(count)) {
      createdByYear[year] = count;
    }
  }
  return createdByYear;
}

function parseNewest(value: unknown): DashboardNewestSchool[] {
  const items = typeof value === "string" ? (JSON.parse(value) as unknown) : value;
  if (!Array.isArray(items)) {
    return [];
  }

  const newest: DashboardNewestSchool[] = [];
  for (const item of items) {
    if (item === null || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const status = record.status;
    if (
      typeof record.id !== "string" ||
      typeof record.name !== "string" ||
      (status !== "pending_setup" &&
        status !== "active" &&
        status !== "suspended")
    ) {
      continue;
    }
    newest.push({
      id: record.id,
      name: record.name,
      slug: typeof record.slug === "string" ? record.slug : null,
      email: typeof record.email === "string" ? record.email : null,
      status,
      created: typeof record.created === "string" ? record.created : "",
    });
  }
  return newest;
}
