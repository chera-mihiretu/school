# Platform admin

Living document. Update this file whenever platform-admin behavior changes.  
Started: 2026-09-05  
Last updated: 2026-09-07 (console sidebar no longer includes Create)

This document covers **only** the platform operator. It does not cover a school director, teacher, staff, student, or parent.

**Subdomain is tenancy, session is identity.** `admin.{root}` only selects the operator host. The operator console requires `platform_admin_session` (HMAC, httpOnly, host-only, SameSite=lax). School hosts cannot call `/admin/*`. A school cookie is not an admin session. Students have no campus console yet.

---

## 1. Who this person is

The platform admin sits above every school.

They create tenants, suspend tenants, and see tenant status. They do not run a school’s grades, classes, or public site.

There is one platform, many schools. The platform admin belongs to the platform, not to any school.

---

## 2. Where they sign in

| Environment | Host |
|---|---|
| Local | `admin.e-school.et:3000` |
| Production | `admin.e-school.et` |

The apex (`e-school.et`) is not the admin console. `admin.<root>/` is resolved by public host resolution (`documents/public-host-resolution.md`) to the operator landing with **Log in**. The form is at `/platform-admin/login`.

Rules:

- Platform admin login lives **only** on the `admin` host.
- `admin` is never a school tenant slug. A school cannot be `admin.e-school.et`.
- School sites use `{slug}.e-school.et`.
- The apex (`e-school.et`) is not the admin console.
- Admin session cookies must be scoped to the admin host. They must not be sent to school hosts.

---

## 3. What they can do in v1

- Sign in on the admin host (separate from school logins).
- Create a school tenant: display name + director email (no slug). Director email is unique across tenants; the platform admin address is also rejected. Both cases return the same generic error (`This email cannot be used.`) so the operator cannot tell admin vs occupied. The tenant is `pending_setup` until the director claims a username later.
- List tenants.
- Resend director credentials while setup is unfinished (`slug` still null, not suspended). This **resets** the temporary password and emails again. The previous temp password is invalid.
- Suspend a tenant: that school’s site and school logins stop; data is kept. Pending rows confirm with email or name, not a slug. Cannot resend while suspended.
- Reactivate a suspended tenant.
- See tenant status: `pending_setup`, `active`, or `suspended`.
- See honest mail status (SMTP accepted ≠ inbox) and whether the director has signed in on `app`.
- Read landing contact messages (`/platform-admin/messages`).
- Console sidebar: Dashboard, Schools, Featured, Messages. `/platform-admin/schools/new` stays a real page; operators open it from **Create a school** (Schools list, empty state, dashboard CTA) or keyboard `c`, not from the sidebar. `/platform-admin/schools` is an exact nav match, so the create page does not highlight Schools.

---

## 4. What they cannot do in v1

- Impersonate a school user.
- Edit grades, attendance, or class arrangements.
- Customize a school’s public website.
- Delete a tenant permanently.
- Choose a school username on create (the director claims it later; it cannot be changed after that).
- Sign in as platform admin from a school host.
- Create, list, invite, or resend **teachers**. That is the school director on `{slug}.<root>`. See `teachers.md`.

---

## 5. Rules (locked)

### 5.1 Identity

- Platform admin accounts live in the **platform schema**, not in a school schema. They have no school schema and no `tenant_id`.
- School users (director, teacher, staff, student, parent) cannot use the admin host to manage the platform.
- Teachers (and later staff, students, parents) belong to one school and live in that school's schema (`tenant_<slug>`). The director identity stays on `platform.tenants`. The operator does not insert those rows.
- v1 starts with a single bootstrap platform-admin created by `node src/seed-platform-admin.ts` (run from `./deploy.sh`). Credentials come from `PLATFORM_ADMIN_EMAIL` / `PLATFORM_ADMIN_PASSWORD`. The password is stored as Argon2id. The seed inserts only when `platform.admins` is empty.

### 5.2 Slugs

- A slug is unique across the platform.
- A slug is one DNS label: lowercase letters, digits, and hyphen. Examples: `demo`, `campus1`, `north-hall`.
- A slug is not nested. `a.b` is invalid.
- Reserved slugs (never tenants): `www`, `api`, `app`, `admin`, `mail`, `ftp`.
- `admin` is reserved for the platform console described in section 2.

### 5.3 Database: schema-per-tenant

One database instance. Each school gets its own schema. That schema is the isolation boundary.

```text
one database
├── platform          registry, platform admins, sessions
├── tenant_demo       that school's teachers, later classes / grades
└── tenant_campus1    that school's teachers, later classes / grades
```

**Platform schema (`platform`)**

- Tenant registry: stable `id`, `name`, `slug`, `schema_name`, `status` (`active` | `suspended`).
- Platform admin accounts and admin sessions.
- Nothing that belongs to a single school (no teachers, no students, no grades).

**School schema (`tenant_<slug>`)**

- Created when the director claims a username (`claimSlug`), not when the operator inserts `pending_setup`.
- Name is `tenant_` + slug with hyphens turned into underscores. Example: `north-hall` → `tenant_north_hall`.
- Holds that school only: `teachers` (see `teachers.md`), and later classes, grades, and other school users.
- Isolation is the schema, not a `tenant_id` column on every row. School queries run inside that schema (set `search_path` / equivalent for the request). They must not read another school's schema.
- Do not place school tables in `platform` or `public`.
- A teacher has no `tenant_id`. The platform operator cannot create teachers; the director does that on the campus host.

**Provisioning**

- `POST /admin/tenants` inserts a `pending_setup` row (`insertPending`: name, email, password hash). It does **not** `CREATE SCHEMA`.
- The school schema is created later when the director claims a username (`claimSlug`): `tenant_<slug>` (hyphens -> underscores) in the same transaction as the slug. `teachers` is created or ensured then, or on first teacher use if an older schema is missing the table.
- `schema_name` is derived (`tenant_` + slug with hyphens turned into underscores). It is not stored as its own column.
- The school username is the slug once claimed. There is no separate username column. Create does not accept a slug.
- Suspend / reactivate change `status` in `platform` only. The school schema is not dropped.
- Hard delete of a schema is out of scope.

**Reserved schema names**

Never used as a school schema: `platform`, `public`, `information_schema`, and any `pg_*` name. The reserved slugs in 5.2 also never produce a school schema.

### 5.4 Hosts

- `admin.<root>` → operator landing (`kind: admin`) with Log in, then the platform console after sign-in.
- `{slug}.<root>` → that school’s landing, and only if the slug exists and the tenant is `active`.
- Unknown slugs do not become implicit tenants.

Public resolution: `GET /public/resolve`. See `public-host-resolution.md`.

### 5.5 Director email

- A director email is unique across `platform.tenants`.
- The platform admin address (`PLATFORM_ADMIN_EMAIL`) cannot be attached to a school.
- Create rejects both cases with the same generic error. The string does not distinguish admin vs occupied.

---

## 6. Backend starting surface

These routes are platform-admin only. They reject unauthenticated callers and any caller who is not a platform admin.

| Method | Path | Purpose |
|---|---|---|
| POST | `/admin/session` | Sign in on the admin host |
| GET | `/admin/session` | Current admin session (Bearer token) |
| DELETE | `/admin/session` | Sign out |
| GET | `/admin/tenants` | List tenants |
| GET | `/admin/tenants/username` | Live username check (`?slug=`) |
| POST | `/admin/tenants` | Create tenant (`name`, `email`) |
| POST | `/admin/tenants/:id/suspend` | Suspend |
| POST | `/admin/tenants/:id/reactivate` | Reactivate |
| POST | `/admin/tenants/:id/resend-credentials` | New temp password + credentials mail |
| GET | `/admin/contact-messages` | List landing contact messages (newest first) |

Notes:

- Session routes are implemented. Identity is the first row in `platform.admins` (Argon2id). `PLATFORM_ADMIN_*` is used only by the seed.
- The Next app on `admin.<root>:3000` is the public console. It sets a host-only `platform_admin_session` cookie and calls the backend with `x-school-host` (the backend’s own `Host` is `backend:5000`).
- POST `/admin/session` requires `Host` or `x-school-host` to be `admin.<root>`. Wrong host → 403. Bad credentials → 401.
- Backend layout and DI rules: `backend-architecture.md`. Admin use cases live in `application` and talk through ports — not through HTTP or Awilix.
- `POST /admin/tenants` body `{ name, email }` → **201** `{ school, credentials: { email, password, firstLoginUrl }, emailSent, emailError? }`. `school` is a `TenantAdminView`: `slug` / `username` / `host` are null, `status` is `pending_setup`, `mustChangePassword` is true. HMAC session + admin host required. Plaintext password is returned only in this 201 and on resend **200**.
- Create hashes a 16+ character temporary password with Argon2id, emails it over Nodemailer SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, optional `SMTP_SECURE`), and still **201s** if mail fails (`emailSent: false`, `emailError`). Missing SMTP config does not throw; send returns `{ ok: false }`. Both create and resend call `recordMailAttempt` after send. The HTML letter uses the Schools console surface (cool-gray canvas, Spline Sans / Spline Mono, accent bar, dark primary Continue), not the public landing.
- `POST /admin/tenants/:id/resend-credentials` is HMAC session + admin host, same as suspend/reactivate. Allowed only while setup is unfinished (`slug === null`) and the tenant is not suspended. **404** if missing, **409** if slug claimed or suspended. Generates a **new** temp password, `updatePassword` with `mustChangePassword: true` (old temp stops working), sends the same credentials mail, **200** `{ school, credentials, emailSent, emailError? }`. Still returns credentials if SMTP fails.
- SMTP `sendMail` success means the **SMTP server accepted the message**, not that it reached the inbox. Gmail SMTP cannot confirm delivery. `school.lastMailOk` is that accept/fail. `school.signedInAt` is set on the first successful director sign-in on `app` and is the operator’s only proof they received the credentials. Console copy: “Director signed in” / “SMTP accepted — not proof of inbox” / “Send failed: …” / “Not sent”.
- We did **not** implement bounce mailboxes, the Gmail API, ESP webhooks, or tracking pixels. Those need an ESP (or mailbox access) that Gmail SMTP does not provide. The product stays on Nodemailer/SMTP; the Resend **button** is not the Resend ESP.
- `firstLoginUrl` is `publicUrl({ label: "app", path: "/first-login?email=" })` from `APP_PROTOCOL` + `APP_HOST`. Local: `http://app.e-school.et:3000/first-login?email=`. Do not infer HTTPS from container `NODE_ENV`.
- Create fails on invalid name or email (**400**) or an unavailable director email (**409** `This email cannot be used.`). Unavailable means another tenant already has that address, or it equals `PLATFORM_ADMIN_EMAIL` (any case/whitespace). The use case checks both **before** insert and **before** sending mail. A unique-index `email_taken` race maps to the same **409**. The error string does not mention admin, operator, or the console. It does not accept a slug.
- Create does not provision a school schema. Schema-per-tenant starts when a username is claimed (see 5.3).
- Suspend/reactivate are idempotent: repeating the same action does not error if the tenant is already in that state. They do not drop or recreate the schema. Pending confirm uses email or name when there is no slug.
- `GET /admin/tenants` is paginated. Query: `page` (default 1, min 1) and `pageSize` (default 10, min 1, max 50). Invalid or missing values fall back to the defaults; values below the minimum clamp up, `pageSize` above 50 clamps to 50.
- `GET /admin/tenants/username?slug=` is a live check. HMAC session + admin host. **200** `{ username, available }` or `{ username, available: false, reason: "invalid" | "reserved" | "taken" }`. The create-school form no longer calls it. School-director first login uses `GET /school-accounts/username` with the same availability helper, so reserved (including `app`), invalid, and taken match.
- Response: `{ schools, page, pageSize, total }`. Each school is `{ id, name, slug, username, email, status, created, founded, host, mustChangePassword, lastMailAt, lastMailOk, lastMailError, signedInAt }` where pending rows have null `slug` / `username` / `host`. Mail fields are ISO strings or null. Rows come from `platform.tenants` only, newest `created_at` first. Featured-directory rows are a different table and are not listed.
- The operator console at `/platform-admin/schools` loads this page (`?page=`) and keeps name/status filters on the current page.

---

## 7. Out of scope (later)

Do not add these to this file as if they were v1. When we start them, append a dated note.

- Billing and plans
- Inviting the school director after tenant create
- School website themes / CMS
- Grades, attendance, roster, parents
- Platform-admin impersonation of a school
- Hard delete of a tenant (and dropping its schema)
- Database-per-tenant (separate server per school)
- Multiple platform-admin roles (support vs owner)

---

## 8. Change log

| Date | Change |
|---|---|
| 2026-09-07 | Console sidebar no longer includes Create. `/platform-admin/schools/new` is opened from **Create a school** (list, empty state, dashboard CTA) or keyboard `c`. |
| 2026-09-07 | Director credentials HTML mail matches the Schools console (cool-gray canvas, Spline type, accent bar, dark Continue), not the apex landing letter. |
| 2026-09-07 | Subdomain is tenancy; session is identity. `admin.{root}` is not a credential. Operator console needs `platform_admin_session`. |
| 2026-09-07 | Operator cannot create teachers. School users (teachers now; later staff / students / parents) live in `tenant_<slug>`. Director identity stays on `platform.tenants`. See `teachers.md`. |
| 2026-09-07 | Director email unique across tenants; `PLATFORM_ADMIN_EMAIL` cannot be a school director. Same generic **409** for both; mail is not sent. |
| 2026-09-07 | `POST /admin/tenants/:id/resend-credentials` resets the temp password and emails again. Create/resend persist `lastMail*` (SMTP accepted ≠ inbox). First app sign-in sets `signedInAt`. Console shows honest mail copy and a Resend button. |
| 2026-09-07 | Credentials `firstLoginUrl` composes from `APP_PROTOCOL` + `APP_HOST` via `publicUrl`. Docker `NODE_ENV=production` is not treated as HTTPS. |
| 2026-09-06 | Admin username lookup shares availability with `GET /school-accounts/username`. Directors claim the slug on `app`. Local wildcard DNS covers campus hosts; see `school-accounts.md`. |
| 2026-09-06 | Tenant create: `POST /admin/tenants` is name + email only. `insertPending` (`pending_setup`, no schema). Argon2id temp password, Nodemailer SMTP credentials mail, 201 `{ school, credentials, emailSent }`. Console stays on a one-time reveal (Zustand). |
| 2026-09-06 | Tenant create (superseded): `POST /admin/tenants` with slug, username = slug, registry + empty `tenant_<slug>` schema. Featured-schools directory is not this flow. |
| 2026-09-06 | Sidebar **Messages** (`/platform-admin/messages`) lists public landing contact form submissions. See `contact-messages.md`. |
| 2026-09-06 | `GET /admin/tenants` pagination (`page`, `pageSize`) returns `{ schools, page, pageSize, total }` from `platform.tenants`. Console `/platform-admin/schools` pages with `?page=`. |
| 2026-09-06 | Admin host `/` is public resolution (`kind: admin`) with a Log in button. See `public-host-resolution.md`. |
| 2026-09-06 | Signed-out admin host (`admin.e-school.et`) shows a Log in button; the form stays at `/platform-admin/login`. |
| 2026-09-06 | Root host is `e-school.et` (`admin.e-school.et`, `{slug}.e-school.et`). Landing directory removed; schools are not hardcoded. Tenant list will come from admin/API. |
| 2026-09-06 | Public landing directory is `platform.featured_schools` (`featured-schools.md`), not tenant create. |
| 2026-09-05 | First version. Platform admin only. Login host `admin.e-school.et:3000`. |
| 2026-09-05 | Tenancy is schema-per-tenant: one database, `platform` schema plus `tenant_<slug>` per school. |
| 2026-09-05 | Backend will follow Clean Architecture + Awilix. See `backend-architecture.md`. Admin routes not implemented yet. |
| 2026-09-05 | Platform and tenant schemas live on the database named by `DATABASE_URL`. See `database.md`. |
| 2026-09-05 | Admin login: POST/GET/DELETE `/admin/session`, HMAC cookie on `admin.e-school.et:3000`. Tenant CRUD still later. |
| 2026-09-05 | First admin is seeded into `platform.admins` from env. Seed is a no-op if any admin exists. Login verifies the Argon2id hash. |
