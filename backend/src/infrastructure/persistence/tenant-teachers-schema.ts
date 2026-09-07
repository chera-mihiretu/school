import type { Sql, TransactionSql } from "postgres";
import { tenantSchemaName } from "../../domain/school-slug.ts";

type Queryable = Sql | TransactionSql;

export function tenantTeachersRelation(sql: Queryable, schemaName: string) {
  return sql(`${schemaName}.teachers`);
}

export function tenantIdCountersRelation(sql: Queryable, schemaName: string) {
  return sql(`${schemaName}.id_counters`);
}

export function tenantStaffRelation(sql: Queryable, schemaName: string) {
  return sql(`${schemaName}.staff`);
}

export function tenantStudentsRelation(sql: Queryable, schemaName: string) {
  return sql(`${schemaName}.students`);
}

export async function ensureTenantTeachersTable(
  sql: Queryable,
  slug: string,
): Promise<string> {
  const schemaName = tenantSchemaName(slug);
  await sql`create schema if not exists ${sql(schemaName)}`;
  await sql`
    create table if not exists ${tenantTeachersRelation(sql, schemaName)} (
      id uuid primary key,
      given_name text not null,
      father_name text not null,
      grandfather_name text not null,
      sex text not null check (sex in ('male', 'female')),
      phone text not null,
      email text not null unique,
      employee_id text,
      password_hash text not null,
      must_change_password boolean not null default true,
      last_mail_at timestamptz,
      last_mail_ok boolean,
      last_mail_error text,
      signed_in_at timestamptz,
      created_at timestamptz not null default now()
    )
  `;
  await sql`
    create unique index if not exists teachers_employee_id_key
    on ${tenantTeachersRelation(sql, schemaName)} (employee_id)
    where employee_id is not null
  `;
  await sql`
    create table if not exists ${tenantIdCountersRelation(sql, schemaName)} (
      role text not null check (role in ('T', 'S', 'F')),
      year_yy text not null,
      last_n integer not null,
      primary key (role, year_yy)
    )
  `;
  await ensureIdCountersRoleIncludesStaff(sql, schemaName);
  await ensureTenantStaffTable(sql, slug);
  await ensureTenantStudentsTable(sql, slug);
  return schemaName;
}

export async function ensureTenantStaffTable(
  sql: Queryable,
  slug: string,
): Promise<string> {
  const schemaName = tenantSchemaName(slug);
  await sql`create schema if not exists ${sql(schemaName)}`;
  await sql`
    create table if not exists ${tenantStaffRelation(sql, schemaName)} (
      id uuid primary key,
      given_name text not null,
      father_name text not null,
      grandfather_name text not null,
      sex text not null check (sex in ('male', 'female')),
      phone text not null,
      email text not null unique,
      employee_id text,
      password_hash text not null,
      must_change_password boolean not null default true,
      last_mail_at timestamptz,
      last_mail_ok boolean,
      last_mail_error text,
      signed_in_at timestamptz,
      created_at timestamptz not null default now()
    )
  `;
  await sql`
    create unique index if not exists staff_employee_id_key
    on ${tenantStaffRelation(sql, schemaName)} (employee_id)
    where employee_id is not null
  `;
  await sql`
    create table if not exists ${tenantIdCountersRelation(sql, schemaName)} (
      role text not null check (role in ('T', 'S', 'F')),
      year_yy text not null,
      last_n integer not null,
      primary key (role, year_yy)
    )
  `;
  await ensureIdCountersRoleIncludesStaff(sql, schemaName);
  await ensureTenantStudentsTable(sql, slug);
  return schemaName;
}

export async function ensureTenantStudentsTable(
  sql: Queryable,
  slug: string,
): Promise<string> {
  const schemaName = tenantSchemaName(slug);
  await sql`create schema if not exists ${sql(schemaName)}`;
  await sql`
    create table if not exists ${tenantStudentsRelation(sql, schemaName)} (
      id uuid primary key,
      given_name text not null,
      father_name text not null,
      grandfather_name text not null,
      sex text not null check (sex in ('male', 'female')),
      phone text,
      email text not null unique,
      employee_id text,
      password_hash text not null,
      must_change_password boolean not null default true,
      last_mail_at timestamptz,
      last_mail_ok boolean,
      last_mail_error text,
      signed_in_at timestamptz,
      created_at timestamptz not null default now()
    )
  `;
  await sql`
    create unique index if not exists students_employee_id_key
    on ${tenantStudentsRelation(sql, schemaName)} (employee_id)
    where employee_id is not null
  `;
  await sql`
    create table if not exists ${tenantIdCountersRelation(sql, schemaName)} (
      role text not null check (role in ('T', 'S', 'F')),
      year_yy text not null,
      last_n integer not null,
      primary key (role, year_yy)
    )
  `;
  await ensureIdCountersRoleIncludesStaff(sql, schemaName);
  return schemaName;
}

async function ensureIdCountersRoleIncludesStaff(
  sql: Queryable,
  schemaName: string,
): Promise<void> {
  const relation = tenantIdCountersRelation(sql, schemaName);
  await sql`alter table ${relation} drop constraint if exists id_counters_role_check`;
  await sql`
    alter table ${relation}
    add constraint id_counters_role_check check (role in ('T', 'S', 'F'))
  `;
}
