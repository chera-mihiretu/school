import type { Sql } from "postgres";
import type { ContactMessage } from "../../domain/contact-messages/contact-message.ts";
import type { ContactMessageStorePort } from "../../domain/ports/contact-message-store-port.ts";

type ContactMessageRow = {
  id: string;
  school_name: string;
  sender_name: string;
  role: string | null;
  email: string;
  note: string;
  phone: string | null;
  created_at: Date;
  acted_at: Date | null;
};

function mapRow(row: ContactMessageRow): ContactMessage {
  return {
    id: row.id,
    schoolName: row.school_name,
    senderName: row.sender_name,
    role: row.role,
    email: row.email,
    note: row.note,
    phone: row.phone,
    createdAt: row.created_at,
    actedAt: row.acted_at,
  };
}

export function createContactMessageStore(sql: Sql): ContactMessageStorePort {
  return {
    async ensureSchema() {
      await sql`create schema if not exists platform`;
      await sql`
        create table if not exists platform.contact_messages (
          id uuid primary key default gen_random_uuid(),
          school_name text not null,
          sender_name text not null,
          role text,
          email text not null,
          note text not null default '',
          phone text,
          created_at timestamptz not null default now(),
          acted_at timestamptz
        )
      `;
      await sql`
        alter table platform.contact_messages
        add column if not exists acted_at timestamptz
      `;
    },
    async insert(input) {
      const rows = await sql<ContactMessageRow[]>`
        insert into platform.contact_messages (
          school_name,
          sender_name,
          role,
          email,
          note,
          phone
        )
        values (
          ${input.schoolName},
          ${input.senderName},
          ${input.role},
          ${input.email},
          ${input.note},
          ${input.phone}
        )
        returning
          id,
          school_name,
          sender_name,
          role,
          email,
          note,
          phone,
          created_at,
          acted_at
      `;
      const row = rows[0];
      if (row === undefined) {
        throw new Error("contact message insert returned no row");
      }
      return mapRow(row);
    },
    async listNewest(query) {
      const totals = await sql<{ count: string; pending: string }[]>`
        select
          count(*)::text as count,
          count(*) filter (where acted_at is null)::text as pending
        from platform.contact_messages
      `;
      const total = Number.parseInt(totals[0]?.count ?? "0", 10);
      const pending = Number.parseInt(totals[0]?.pending ?? "0", 10);
      const rows = await sql<ContactMessageRow[]>`
        select
          id,
          school_name,
          sender_name,
          role,
          email,
          note,
          phone,
          created_at,
          acted_at
        from platform.contact_messages
        order by (acted_at is null) desc, created_at desc
        limit ${query.limit}
        offset ${query.offset}
      `;
      return {
        messages: rows.map(mapRow),
        total,
        pending,
      };
    },
    async markActed(id) {
      const rows = await sql<ContactMessageRow[]>`
        update platform.contact_messages
        set acted_at = coalesce(acted_at, now())
        where id = ${id}
        returning
          id,
          school_name,
          sender_name,
          role,
          email,
          note,
          phone,
          created_at,
          acted_at
      `;
      const row = rows[0];
      if (row === undefined) {
        return undefined;
      }
      return mapRow(row);
    },
  };
}
