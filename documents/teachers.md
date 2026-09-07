# Teachers

Living document. Update when director-created teacher accounts or campus teacher session behavior changes.
Started: 2026-09-07
Last updated: 2026-09-07 (director sidebar without Add)

This document is the **approved contract** for teacher accounts. Backend and frontend implement against it. If a later code detail disagrees, this file wins.

It covers teachers created by a **school director** on that school's campus host. It does not cover the platform operator (`platform-admin.md`) or the director's first login on `app` (`school-accounts.md`). Students have **no campus console** yet. `{slug}.<root>/students` is not a product; it only redirects to `/login`.

---

## 0. Subdomain is tenancy, session is identity

The Host header / `{slug}.e-school.et` **selects the tenant**. It is **not** a credential. Opening a campus host does not make anyone a director, teacher, or student.

Privileged UI and APIs require a **secured session** (`school_account_session`, HMAC, httpOnly, host-only, SameSite=lax). The cookie must carry an explicit `kind`. A token without `kind` is rejected on campus (it is not treated as director).

| Role | Host | Session |
|---|---|---|
| Platform admin | `admin.{root}` | `platform_admin_session` only |
| School director | `{slug}.{root}` | campus `school_account_session` with `kind: "director"` |
| Teacher | `{slug}.{root}` | same cookie name with `kind: "teacher"` |
| Student | — | not built; no student portal |

Public may stay on the subdomain without a session: campus landing `/` (name + Log in). `/dashboard`, `/teachers`, `/teachers/new`, `/staff`, `/staff/new`, and `/settings` are director-only (server `requireCampusDirector`). A teacher or staff session on those routes redirects to `/login`. `/staff` is the staff roster; `/staff/new` is add-a-staff-member. See `staff.md`.

---

## 1. Who this person is

The school director, signed in on `{slug}.e-school.et`, creates teachers for **that school only**.

- A teacher belongs to one school. They have no platform role and no row in another school's schema.
- The platform operator **cannot** create, list, invite, or resend teacher credentials. Admin routes stay on tenants and the operator inbox.
- Teachers never use `app.<root>`. First login, password change, and later campus work all stay on the campus host.

They are not a platform admin. An admin session cookie is not a campus session. A director cookie is not a teacher cookie (same cookie name, different `kind`).

---

## 2. Schema-per-tenant

Teachers live in the school schema. Isolation is the schema, not a `tenant_id` column.

```text
one database
├── platform              tenants (director identity), platform admins
├── tenant_demo           teachers, later classes / grades
└── tenant_north_hall     teachers for slug north-hall
```

- Table name: `teachers`
- Schema name: `tenant_<slug>` with hyphens in the slug turned into underscores. Example: `north-hall` -> `tenant_north_hall`
- No `tenant_id` on the row. School queries run inside that schema (`search_path` / equivalent). They must not read another school's schema.
- Do not place `teachers` in `platform` or `public`.

The table is **created or ensured** when the school schema exists:

1. The director claims a username (`claimSlug`): `CREATE SCHEMA tenant_<slug>` in the same transaction as the slug. That is when the school schema first exists. Ensure `teachers` there.
2. If an older campus schema is missing the table, ensure it on first teacher use (`GET` / `POST /school-teachers` and related campus teacher routes).

```sql
-- search_path is tenant_<slug> (hyphens in the slug become underscores)
create table if not exists teachers (
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
);

create unique index if not exists teachers_employee_id_unique
  on teachers (employee_id)
  where employee_id is not null;

create table if not exists id_counters (
  role text not null check (role in ('T', 'S')),
  year_yy text not null,
  last_n int not null,
  primary key (role, year_yy)
);
```

No `tenant_id`. Unique `email` is per schema (per school). Unique `employee_id` is per schema where not null (existing nulls stay). Person numbers live in `id_counters`. See `school-abbreviation.md`.

See `platform-admin.md` section 5.3 and `database.md`.

---

## 3. Ethiopian fields

Create accepts the three Ethiopian names, sex, phone, and email. The school **does not type** an employee ID. On insert the server assigns `AAAT/00001/26` from the school's locked abbreviation, role `T`, a per-year counter, and the Gregorian year in `Africa/Addis_Ababa`. `displayName` is **derived** (not a create input): given name, father name, grandfather name, joined with spaces.

| Field | Required | Rules |
|---|---|---|
| `givenName` | yes | Person's own name |
| `fatherName` | yes | Father's name |
| `grandfatherName` | yes | Grandfather's name |
| `displayName` | derived | `{givenName} {fatherName} {grandfatherName}` |
| `sex` | yes | `male` or `female` only |
| `phone` | yes | E.164 Ethiopia mobile: `+251` then `9` or `7`, then 8 digits. Example: `+251911234567` |
| `email` | yes | Unique in that school. See section 7 |
| `employeeId` | assigned | Printed school ID. Not a login. Existing rows keep whatever they already have |

Invalid name, sex, phone, or email -> **400**. Abbreviation still null -> **409** `Set the school abbreviation in Settings first.` Do not store a local `09...` number; persist E.164.

```ts
type TeacherSex = "male" | "female";

type CreateTeacherInput = {
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: TeacherSex;
  phone: string;
  email: string;
};

type TeacherView = {
  id: string;
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  displayName: string;
  sex: TeacherSex;
  phone: string;
  email: string;
  employeeId: string | null;
  mustChangePassword: boolean;
  signedInAt: string | null;
  created: string;
};
```

---

## 4. Invite flow

Same honesty model as director credentials (`school-accounts.md`, `platform-admin.md`): SMTP accepted is **not** inbox delivery. `signedInAt` is the proof they received the password.

1. Director submits the create form on `/teachers/new`.
2. Server hashes a temporary password (Argon2id, 16+ characters), inserts the teacher with `mustChangePassword: true`, and emails school ID + email + temp password on the campus cream/brick letter (`campus-mail`, shared with staff and student mail — not the admin director letter).
3. Create still **201s** if mail fails (`emailSent: false`, `emailError`). Plaintext password is returned only in that 201 and on resend **200**.
4. The mail points at **campus** `/login` on `{slug}.<root>`, not `app.<root>/first-login`. Teachers never open the app host.
5. Teacher signs in on `/login` with **email or school ID** (`AAAT/00001/26`) and the temporary password. Campus session may have `mustChangePassword: true`.
6. Teacher must change password (`POST /school-teachers/password`) before using the rest of campus. Min 12 characters; new password must not equal the current password.
7. **Resend** is allowed only while `mustChangePassword` is still true. It generates a new temp password, invalidates the previous one, and sends the same campus credentials mail again.
8. First successful campus sign-in records `signedInAt` on the teacher row (not overwritten later). If recording `signedInAt` throws, sign-in still returns the session.

`credentials` on create/resend include the email, the generated school ID (`employee_id`, or `null` on legacy rows), the plaintext temp password, and the campus login URL (`publicUrl({ label: slug, path: "/login?email=" })`). Do not infer HTTPS from container `NODE_ENV`.

---

## 5. HTTP (campus host only)

All `/school-teachers` routes require a campus host (`{slug}.<root>` that matches an `active` tenant). Wrong host -> **403**. `app.<root>` and `admin.<root>` are never valid. Admin cookies are rejected.

Director routes need a campus session with `kind: "director"`. Teacher password change needs `kind: "teacher"`. Missing, invalid, or kind-less session -> **401**. Wrong `kind` -> **403**. Host alone is never enough.

| Method | Path | Session | Purpose |
|---|---|---|---|
| POST | `/school-teachers` | Director | Create teacher |
| GET | `/school-teachers` | Director | List teachers |
| POST | `/school-teachers/:id/resend-credentials` | Director | New temp password + mail |
| POST | `/school-teachers/password` | Teacher | Change password |

Campus session routes stay on `/school-accounts/campus-session` (see `school-accounts.md`). They now return `kind` and `mustChangePassword`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/school-accounts/campus-session` | Sign in (director or teacher) |
| GET | `/school-accounts/campus-session` | Current campus session |
| DELETE | `/school-accounts/campus-session` | Sign out |

### POST `/school-teachers`

Body: `{ givenName, fatherName, grandfatherName, sex, phone, email }`

**201** `{ teacher, credentials, emailSent, emailError? }`

- HMAC campus director session + campus host
- Email conflict (section 7) -> **409** `This email cannot be used.`
- School abbreviation not set -> **409** `Set the school abbreviation in Settings first.`
- Invalid body -> **400**
- Suspended tenant -> **403**
- Mail failure does not roll back the insert

### GET `/school-teachers`

**200** `{ teachers }` where `teachers` is `TeacherView[]` for that school schema only.

### POST `/school-teachers/:id/resend-credentials`

**200** `{ teacher, credentials, emailSent, emailError? }`

- Allowed only while that teacher still has `mustChangePassword === true`
- **404** if the id is not in this school
- **409** if they already changed the password (or the tenant is not in a state that can resend)
- New temp password; previous temp stops working
- Still returns credentials if SMTP fails

### POST `/school-teachers/password`

Body: `{ password }`

- Teacher campus session required
- Min 12 characters
- New password must not equal the current password
- Persist with `mustChangePassword: false`
- Session `expiresAt` stays the existing session lifetime

### Campus sign-in (`POST /school-accounts/campus-session`)

Body is `{ identifier, password }` (`email` is still accepted as an alias for `identifier`). Directors sign in with email only. Teachers sign in with email **or** the printed school ID (`AAAT/00001/26`, spaces ignored, case-insensitive). Student-shaped IDs (`AAAS/…`) return the same **401** as a wrong password; student accounts are not a product yet.

- Wrong host -> **403**
- Suspended tenant -> **403**
- Unknown identifier or wrong password -> **401** `Invalid email, school ID, or password`
- Director: `status === "active"`, `mustChangePassword === false` (password already changed on `app`), host slug matches the account
- Teacher: tenant `active`, host slug matches the school; `mustChangePassword` may be **true** (first campus login)
- Response session includes `kind: "director" | "teacher"` and `mustChangePassword`. Session `email` is still the account email even when they signed in with an ID.

---

## 6. Session

Cookie name: **`school_account_session`** (same as director campus). Host-only, `httpOnly`, `SameSite=lax`. Set and cleared by the Next app. Not sent to `admin.<root>` or `app.<root>`.

```ts
type CampusSessionKind = "director" | "teacher";

type CampusSessionView = {
  accountId: string;
  email: string;
  expiresAt: string;
  slug: string;
  host: string;
  kind: CampusSessionKind;
  mustChangePassword: boolean;
};
```

`accountId` is the director tenant id when `kind` is `"director"`, or the teacher id when `kind` is `"teacher"`.

Campus HMAC must include `kind`. A token issued on `app` (no `kind`) is not a campus director session.

Rules:

- Teachers are **never** minted on `app.<root>`. `GET` / `POST /school-accounts/session` stay director first-login only.
- A teacher who opens `app.<root>` is a public app landing visitor, not a school session.
- After campus sign-in, a **director** is sent to `/dashboard` (sidebar shell: Dashboard + Teachers + Staff + Settings). They do not stay on `/login` or the public campus landing. `/teachers/new` is opened from **Add a teacher**, not the sidebar. See `public-host-resolution.md`.
- After campus sign-in, a **teacher** with `mustChangePassword` stays on the campus password step at `/login`. Later teacher tools (gradebooks and the rest) are out of scope here. Teachers never see the director shell.

---

## 7. Uniqueness

Teacher `email` is unique **inside that school** (`tenant_<slug>.teachers`, unique on `email`). It is not a platform-wide teacher directory.

Create and resend reject the address, with the same generic string, when it:

- already belongs to a teacher in this school, or
- equals this school's director email (`platform.tenants.email`), or
- equals `PLATFORM_ADMIN_EMAIL` (any case / whitespace)

**409** `This email cannot be used.`

The string does not mention admin, operator, director, or which row collided. Check **before** insert and **before** mail. A unique-index race maps to the same **409**.

---

## 8. Frontend

Lives under `frontend/src/stores/` (see `zustand.md`).

- `useTeachersStore` (`teachers-store.ts`) - director `/teachers` list (roster + resend) and `/teachers/new` create draft (Ethiopian names, sex, phone, email), pending, error, one-time credentials reveal (school ID + email + password). Do **not** put this in `useCreateSchoolStore` or `useFirstLoginStore`. The form does not collect `employeeId`; the list shows the generated ID. `resetDraft()` on leave of `/teachers/new`.
- `useCampusLoginStore` (`campus-login-store.ts`) - campus `/login` `identifier` (email or school ID), session (`kind`, `mustChangePassword`), and teacher password-change fields. The login input is `type="text"`.
- `useCampusDashboardStore` (`campus-dashboard-store.ts`) - director shell mobile drawer only.

`requireCampusHost` still 404s unless public resolve is `kind: "campus"`. `/dashboard`, `/teachers`, `/teachers/new`, `/staff`, `/staff/new`, and `/settings` also require a **director** session (`requireCampusDirector`). Missing session or `kind === "teacher"` or `kind === "staff"` redirects to `/login`. Teachers and staff never see the director shell.

---

## 9. Change log

| Date | Change |
|---|---|
| 2026-09-07 | Teacher, staff, and student credentials HTML mail share the campus cream/brick letter. Director invite mail stays the Schools console letter. |
| 2026-09-07 | Director `/staff` is the staff roster; `/staff/new` is add-a-staff-member. See `staff.md`. |
| 2026-09-07 | Director sidebar is Dashboard + Teachers + Staff + Settings. `/teachers/new` is opened from Add a teacher, not a sidebar item. |
| 2026-09-07 | Director `/staff` is a UI placeholder for student management, student accounts, payments, and teacher salary. No backend yet. |
| 2026-09-07 | Campus `/login` accepts teacher email or school ID (`AAAT/00001/26`). Credentials mail and the reveal dialog include the ID. Student IDs (`AAAS/…`) are 401 with the same generic error. Directors still use email. |
| 2026-09-07 | Director `/teachers` is the roster. `/teachers/new` is add-a-teacher, same split as admin Schools / Create. |
| 2026-09-07 | Teacher IDs are generated (`AAAT/00001/26`). Create no longer accepts `employeeId`. Missing school abbreviation is **409**. See `school-abbreviation.md`. |
| 2026-09-07 | Subdomain is tenancy; session is identity. Campus HMAC must include `kind`. Kind-less tokens are 401, not director. `/students` redirects to `/login`. |
| 2026-09-07 | Director campus routes: `/dashboard` (home + teacher count) and `/teachers` (create / list / resend) behind a sidebar shell. Public `/` stays the name + Log in page. Signed-in director on `/` or `/login` redirects to `/dashboard`. Teachers stay on `/login` (password / you’re in). |
| 2026-09-07 | First version. Director on `{slug}.<root>` creates teachers in `tenant_<slug>.teachers`. Platform operator cannot. Campus session `kind` is `director` or `teacher`. Teachers never use `app.`. Email unique per school; director and `PLATFORM_ADMIN_EMAIL` collide as `This email cannot be used.` SMTP accepted is not inbox; `signedInAt` is proof. |
