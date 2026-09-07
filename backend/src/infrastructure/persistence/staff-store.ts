import { randomUUID } from "node:crypto";
import type { Sql } from "postgres";
import type { StaffStorePort } from "../../domain/ports/staff-store-port.ts";
import { tenantSchemaName } from "../../domain/school-slug.ts";
import {
  isStaffSex,
  normalizeStaffEmail,
  type Staff,
} from "../../domain/staff/staff.ts";
import {
  ensureTenantStaffTable,
  tenantIdCountersRelation,
  tenantStaffRelation,
} from "./tenant-teachers-schema.ts";

type StaffRow = {
  id: string;
  given_name: string;
  father_name: string;
  grandfather_name: string;
  sex: string;
  phone: string;
  email: string;
  employee_id: string | null;
  must_change_password: boolean;
  last_mail_at: Date | null;
  last_mail_ok: boolean | null;
  last_mail_error: string | null;
  signed_in_at: Date | null;
  created_at: Date;
};

type StaffAuthRow = StaffRow & {
  password_hash: string;
};

function mapRow(row: StaffRow): Staff {
  if (!isStaffSex(row.sex)) {
    throw new Error("invalid staff sex");
  }
  return {
    id: row.id,
    givenName: row.given_name,
    fatherName: row.father_name,
    grandfatherName: row.grandfather_name,
    sex: row.sex,
    phone: row.phone,
    email: row.email,
    employeeId: row.employee_id,
    mustChangePassword: row.must_change_password,
    lastMailAt: row.last_mail_at,
    lastMailOk: row.last_mail_ok,
    lastMailError: row.last_mail_error,
    signedInAt: row.signed_in_at,
    createdAt: row.created_at,
  };
}

function mapAuth(row: StaffAuthRow | undefined) {
  if (row === undefined || row.password_hash.length === 0) {
    return undefined;
  }
  return { staff: mapRow(row), passwordHash: row.password_hash };
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "23505"
  );
}

function isUndefinedTable(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "42P01"
  );
}

export function createStaffStore(sql: Sql): StaffStorePort {
  return {
    async ensureSchema(slug) {
      await ensureTenantStaffTable(sql, slug);
    },
    async nextPersonNumber(slug, role, yearYy) {
      const schemaName = await ensureTenantStaffTable(sql, slug);
      const relation = tenantIdCountersRelation(sql, schemaName);
      const rows = await sql<{ last_n: number }[]>`
        insert into ${relation} (role, year_yy, last_n)
        values (${role}, ${yearYy}, 1)
        on conflict (role, year_yy)
        do update set last_n = ${relation}.last_n + 1
        returning last_n
      `;
      const row = rows[0];
      if (row === undefined) {
        throw new Error("id counter returned no row");
      }
      return row.last_n;
    },
    async insert(slug, input) {
      const schemaName = await ensureTenantStaffTable(sql, slug);
      const email = normalizeStaffEmail(input.email);
      const id = randomUUID();
      try {
        const rows = await sql<StaffRow[]>`
          insert into ${tenantStaffRelation(sql, schemaName)} (
            id,
            given_name,
            father_name,
            grandfather_name,
            sex,
            phone,
            email,
            employee_id,
            password_hash,
            must_change_password
          )
          values (
            ${id},
            ${input.givenName},
            ${input.fatherName},
            ${input.grandfatherName},
            ${input.sex},
            ${input.phone},
            ${email},
            ${input.employeeId},
            ${input.passwordHash},
            true
          )
          returning
            id,
            given_name,
            father_name,
            grandfather_name,
            sex,
            phone,
            email,
            employee_id,
            must_change_password,
            last_mail_at,
            last_mail_ok,
            last_mail_error,
            signed_in_at,
            created_at
        `;
        const row = rows[0];
        if (row === undefined) {
          throw new Error("staff insert returned no row");
        }
        return { ok: true, staff: mapRow(row) };
      } catch (err) {
        if (isUniqueViolation(err)) {
          return { ok: false, reason: "email_taken" };
        }
        throw err;
      }
    },
    async findByEmail(slug, email) {
      const row = await selectByEmail(sql, slug, email);
      return row === undefined ? undefined : mapRow(row);
    },
    async findById(slug, id) {
      const row = await selectById(sql, slug, id);
      return row === undefined ? undefined : mapRow(row);
    },
    async findAuthByEmail(slug, email) {
      try {
        const schemaName = tenantSchemaName(slug);
        const normalized = normalizeStaffEmail(email);
        const rows = await sql<StaffAuthRow[]>`
          select
            id,
            given_name,
            father_name,
            grandfather_name,
            sex,
            phone,
            email,
            employee_id,
            must_change_password,
            last_mail_at,
            last_mail_ok,
            last_mail_error,
            signed_in_at,
            created_at,
            password_hash
          from ${tenantStaffRelation(sql, schemaName)}
          where email = ${normalized}
          limit 1
        `;
        return mapAuth(rows[0]);
      } catch (err) {
        if (isUndefinedTable(err)) {
          return undefined;
        }
        throw err;
      }
    },
    async findAuthByEmployeeId(slug, employeeId) {
      const needle = employeeId.trim().toUpperCase();
      if (needle.length === 0) {
        return undefined;
      }
      try {
        const schemaName = tenantSchemaName(slug);
        const rows = await sql<StaffAuthRow[]>`
          select
            id,
            given_name,
            father_name,
            grandfather_name,
            sex,
            phone,
            email,
            employee_id,
            must_change_password,
            last_mail_at,
            last_mail_ok,
            last_mail_error,
            signed_in_at,
            created_at,
            password_hash
          from ${tenantStaffRelation(sql, schemaName)}
          where employee_id is not null and upper(employee_id) = ${needle}
          limit 1
        `;
        return mapAuth(rows[0]);
      } catch (err) {
        if (isUndefinedTable(err)) {
          return undefined;
        }
        throw err;
      }
    },
    async findAuthById(slug, id) {
      try {
        const schemaName = tenantSchemaName(slug);
        const rows = await sql<StaffAuthRow[]>`
          select
            id,
            given_name,
            father_name,
            grandfather_name,
            sex,
            phone,
            email,
            employee_id,
            must_change_password,
            last_mail_at,
            last_mail_ok,
            last_mail_error,
            signed_in_at,
            created_at,
            password_hash
          from ${tenantStaffRelation(sql, schemaName)}
          where id = ${id}
          limit 1
        `;
        return mapAuth(rows[0]);
      } catch (err) {
        if (isUndefinedTable(err)) {
          return undefined;
        }
        throw err;
      }
    },
    async listNewestFirst(slug) {
      const schemaName = await ensureTenantStaffTable(sql, slug);
      const rows = await sql<StaffRow[]>`
        select
          id,
          given_name,
          father_name,
          grandfather_name,
          sex,
          phone,
          email,
          employee_id,
          must_change_password,
          last_mail_at,
          last_mail_ok,
          last_mail_error,
          signed_in_at,
          created_at
        from ${tenantStaffRelation(sql, schemaName)}
        order by created_at desc, id desc
      `;
      return rows.map(mapRow);
    },
    async updatePassword(slug, input) {
      const schemaName = await ensureTenantStaffTable(sql, slug);
      const rows = await sql<StaffRow[]>`
        update ${tenantStaffRelation(sql, schemaName)}
        set
          password_hash = ${input.passwordHash},
          must_change_password = ${input.mustChangePassword}
        where id = ${input.id}
        returning
          id,
          given_name,
          father_name,
          grandfather_name,
          sex,
          phone,
          email,
          employee_id,
          must_change_password,
          last_mail_at,
          last_mail_ok,
          last_mail_error,
          signed_in_at,
          created_at
      `;
      const row = rows[0];
      if (row === undefined) {
        return { ok: false, reason: "not_found" };
      }
      return { ok: true, staff: mapRow(row) };
    },
    async recordMailAttempt(slug, id, input) {
      const schemaName = await ensureTenantStaffTable(sql, slug);
      const error = input.ok ? null : (input.error ?? "Failed to send email");
      const rows = await sql<StaffRow[]>`
        update ${tenantStaffRelation(sql, schemaName)}
        set
          last_mail_at = ${input.at},
          last_mail_ok = ${input.ok},
          last_mail_error = ${error}
        where id = ${id}
        returning
          id,
          given_name,
          father_name,
          grandfather_name,
          sex,
          phone,
          email,
          employee_id,
          must_change_password,
          last_mail_at,
          last_mail_ok,
          last_mail_error,
          signed_in_at,
          created_at
      `;
      const row = rows[0];
      if (row === undefined) {
        return { ok: false, reason: "not_found" };
      }
      return { ok: true, staff: mapRow(row) };
    },
    async recordSignIn(slug, id, at) {
      const schemaName = tenantSchemaName(slug);
      try {
        const updated = await sql<StaffRow[]>`
          update ${tenantStaffRelation(sql, schemaName)}
          set signed_in_at = ${at}
          where id = ${id} and signed_in_at is null
          returning
            id,
            given_name,
            father_name,
            grandfather_name,
            sex,
            phone,
            email,
            employee_id,
            must_change_password,
            last_mail_at,
            last_mail_ok,
            last_mail_error,
            signed_in_at,
            created_at
        `;
        const row = updated[0];
        if (row !== undefined) {
          return { ok: true, staff: mapRow(row) };
        }

        const existing = await selectById(sql, slug, id);
        if (existing === undefined) {
          return { ok: false, reason: "not_found" };
        }
        return { ok: true, staff: mapRow(existing) };
      } catch (err) {
        if (isUndefinedTable(err)) {
          return { ok: false, reason: "not_found" };
        }
        throw err;
      }
    },
  };
}

async function selectByEmail(
  sql: Sql,
  slug: string,
  email: string,
): Promise<StaffRow | undefined> {
  try {
    const schemaName = tenantSchemaName(slug);
    const normalized = normalizeStaffEmail(email);
    const rows = await sql<StaffRow[]>`
      select
        id,
        given_name,
        father_name,
        grandfather_name,
        sex,
        phone,
        email,
        employee_id,
        must_change_password,
        last_mail_at,
        last_mail_ok,
        last_mail_error,
        signed_in_at,
        created_at
      from ${tenantStaffRelation(sql, schemaName)}
      where email = ${normalized}
      limit 1
    `;
    return rows[0];
  } catch (err) {
    if (isUndefinedTable(err)) {
      return undefined;
    }
    throw err;
  }
}

async function selectById(
  sql: Sql,
  slug: string,
  id: string,
): Promise<StaffRow | undefined> {
  try {
    const schemaName = tenantSchemaName(slug);
    const rows = await sql<StaffRow[]>`
      select
        id,
        given_name,
        father_name,
        grandfather_name,
        sex,
        phone,
        email,
        employee_id,
        must_change_password,
        last_mail_at,
        last_mail_ok,
        last_mail_error,
        signed_in_at,
        created_at
      from ${tenantStaffRelation(sql, schemaName)}
      where id = ${id}
      limit 1
    `;
    return rows[0];
  } catch (err) {
    if (isUndefinedTable(err)) {
      return undefined;
    }
    throw err;
  }
}
