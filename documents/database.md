# Database

Living document.  
Started: 2026-09-05  
Last updated: 2026-09-07 (staff table + id_counters role F)

The backend talks **Postgres only**, through a generic driver (`postgres` / Postgres.js). Hosting is not a code concern. Neon, Supabase, RDS, or a local container are the same as long as they accept a Postgres URL.

---

## How we stay vendor-neutral

- Use `DATABASE_URL` (`postgres://` or `postgresql://`).
- Do **not** add `@neondatabase/serverless`, `@supabase/supabase-js`, or other vendor clients in application or domain code.
- SSL comes from `sslmode=` on the URL, or `DATABASE_SSL=require|disable`.
- Schema-per-tenant (see `platform-admin.md`) lives *inside* whatever database that URL points at. Moving hosts does not change schema names.

Switching providers: change `backend/.env`, restart the backend. No source edit.

`./deploy.sh` starts `postgres-service` inside Docker. It is not installed on the host and does not publish port 5432. The backend reaches it on the compose network through `DATABASE_URL` only:

- Unset / local default → `postgresql://school:school@postgres:5432/school`
- Supabase / Neon → paste that URI into `backend/.env`. Transaction poolers (`:6543` or `*.pooler.supabase.com`) turn off prepared statements automatically.

---

## Keys

| Key | Required | Meaning |
|---|---|---|
| `DATABASE_URL` | yes | Full Postgres URL |
| `DATABASE_SSL` | no | Overrides `sslmode` in the URL (`require` or `disable`) |
| `SMTP_HOST` | no | Nodemailer SMTP host. Missing → credentials mail is skipped |
| `SMTP_PORT` | no | SMTP port (default `587`) |
| `SMTP_USER` | no | SMTP username |
| `SMTP_PASS` | no | SMTP password. Do not commit a real value |
| `MAIL_FROM` | no | From address. Required together with `SMTP_HOST` to send |
| `SMTP_SECURE` | no | `true` / `1` for TLS-on-connect. Default true when port is `465` |

---

## Examples

Local Compose (default in `backend/.env`):

```text
DATABASE_URL=postgresql://school:school@postgres:5432/school
```

Neon:

```text
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

Supabase (pooler):

```text
DATABASE_URL=postgresql://postgres.PROJECT:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require
```

Copy `backend/.env.example` to `backend/.env` and replace the URL. Frontend host settings live in `frontend/.env`. There is no root `.env`.

---

## Layers

- `GET /health` pings the database (`database: "up" | "down"`). Docker uses that as the backend healthcheck.
- `platform.admins` — first admin seed (`email` unique, `password_hash` Argon2id PHC)
- `platform.featured_schools` — public landing directory (not tenant schemas). See `featured-schools.md`.
- `platform.contact_messages` — landing contact inbox. See `contact-messages.md`.
- `platform.tenants` — school registry (`id`, `name`, `slug` nullable unique, `abbreviation` nullable unique on `upper(abbreviation)` where not null, `email` nullable unique, `password_hash`, `must_change_password`, `status` `pending_setup` | `active` | `suspended`, `founded`, `created_at`). A school can exist before it has a slug (`pending_setup`, no `CREATE SCHEMA`). `POST /admin/tenants` uses `insertPending` (name, email, password hash). `claimSlug` sets the permanent slug, flips status to `active`, and creates `tenant_<slug>` in one transaction. A second claim is `already_claimed`. The three-letter code is claimed later (`claimAbbreviation`); null means unset, non-null means locked. Paginated by `GET /admin/tenants`. Not the featured-schools directory. `ensureSchema` ALTERs older tables (slug nullable, new columns, expanded status check, abbreviation). See `school-abbreviation.md`.
- `tenant_<slug>.teachers` - teachers for that school only. Schema name is `tenant_` + slug with hyphens turned into underscores (`north-hall` -> `tenant_north_hall`). No `tenant_id`; isolation is the schema. Ensured when the school schema exists (`claimSlug`) or on first teacher use. Columns: `id`, `given_name`, `father_name`, `grandfather_name`, `sex` (`male` | `female`), `phone` (E.164 `+251` then `9` or `7`), `email` (unique in that schema), `employee_id` (generated `AAAT/00001/26` on new creates; unique where not null), `password_hash`, `must_change_password`, `last_mail_at`, `last_mail_ok`, `last_mail_error`, `signed_in_at`, `created_at`. `displayName` is derived in the API view, not stored. Director identity stays on `platform.tenants`. See `teachers.md`.
- `tenant_<slug>.staff` — staff for that school only. Same columns as `teachers`. `employee_id` is generated `AAAF/00001/26`. Unique email; unique `employee_id` where not null. Ensured on `claimSlug` (with the teachers table) and on first staff use. See `staff.md`.
- `tenant_<slug>.id_counters` — `(role, year_yy, last_n)` with `role` `T`|`S`|`F`. Existing campuses drop and re-add `id_counters_role_check` so `F` is allowed. Allocated in the same school schema when a person ID is issued. See `school-abbreviation.md`.
- SMTP (Nodemailer, not Resend): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, optional `SMTP_SECURE`. Documented in `backend/.env.example`. Missing config makes `MailerPort.send` return `{ ok: false }` without throwing. Do not commit real SMTP passwords.
- `domain/ports/database-port.ts` — `ping` / `close` (queries come later)
- `infrastructure/persistence/postgres.ts` — Postgres.js adapter
- `infrastructure/config/database-url.ts` — parse URL + SSL
- Composition root registers `database` and disposes the pool on shutdown

---

## Change log

| Date | Change |
|---|---|
| 2026-09-07 | `tenant_<slug>.staff` (same columns as teachers). `id_counters` role includes `F`. See `staff.md`. |
| 2026-09-07 | `platform.tenants.abbreviation` (nullable, unique when set). `tenant_<slug>.id_counters` and unique `teachers.employee_id` where not null. See `school-abbreviation.md`. |
| 2026-09-07 | `tenant_<slug>.teachers` is the first school-schema table. No `tenant_id`. Ensured on claim username / first teacher use. See `teachers.md`. |
| 2026-09-06 | `findAuthByEmail` / `findAuthById` return the password hash for school-account sign-in and password change. Hash stays off the public `Tenant` type. |
| 2026-09-06 | `POST /admin/tenants` is `insertPending` (name + email). SMTP env keys for credentials mail. Schema-per-tenant still starts on `claimSlug`. |
| 2026-09-06 | `platform.tenants.slug` is nullable. Added `email`, `password_hash`, `must_change_password`, and status `pending_setup`. Schema-per-tenant is created on `claimSlug`, not on a pending insert. |
| 2026-09-06 | `platform.contact_messages` created on backend start. Public landing inbox, not tenant data. |
| 2026-09-05 | Single `DATABASE_URL`. Postgres.js. Local Compose Postgres 18. Neon/Supabase are env-only. |
| 2026-09-05 | Compose mounts Postgres 18 at `/var/lib/postgresql` (not `/var/lib/postgresql/data`). |
| 2026-09-05 | `./deploy.sh` waits for `postgres-service`. Health pings `DATABASE_URL`. Supabase pooler disables prepared statements. |
| 2026-09-05 | Local Postgres stays in Docker only. Port 5432 is not published on the host. |
| 2026-09-05 | `platform.admins` created on backend start. `./deploy.sh` seeds the first admin once. |
| 2026-09-05 | Env files are per service: `backend/.env` and `frontend/.env`. Compose uses `env_file`. No root `.env`. |
| 2026-09-06 | `platform.tenants` created on backend start. Operator school list, not featured-schools. |
| 2026-09-06 | `platform.featured_schools` created on backend start. Public show-off list, not tenant provisioning. |
