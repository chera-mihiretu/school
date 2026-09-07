# Staff

Living document. Update when director-created staff accounts or campus staff session behavior changes.
Started: 2026-09-07
Last updated: 2026-09-07

This document is the **approved contract** for school staff accounts. Backend and frontend implement against it. If a later code detail disagrees, this file wins.

It covers staff created by a **school director** on that school's campus host. It does not cover the platform operator (`platform-admin.md`) or the director's first login on `app` (`school-accounts.md`). Staff are office accounts (`F` printed IDs). Students (`S`) still have **no campus console**.

---

## 0. Subdomain is tenancy, session is identity

The Host header / `{slug}.e-school.et` **selects the tenant**. Privileged UI and APIs require a campus session (`school_account_session`) with an explicit `kind`.

| Role | Host | Session |
|---|---|---|
| Platform admin | `admin.{root}` | `platform_admin_session` only |
| School director | `{slug}.{root}` | campus cookie `kind: "director"` |
| Teacher | `{slug}.{root}` | campus cookie `kind: "teacher"` |
| Staff | `{slug}.{root}` | campus cookie `kind: "staff"` |
| Student | — | not built; student IDs (`AAAS/…`) are 401 on campus login |

`/dashboard`, `/teachers`, `/teachers/new`, `/staff`, `/staff/new`, and `/settings` are director-only (`requireCampusDirector`). A staff or teacher session on those routes redirects to `/login`.

---

## 1. Who this person is

The school director, signed in on `{slug}.e-school.et`, creates staff for **that school only**.

- A staff member belongs to one school (`tenant_<slug>.staff`).
- The platform operator **cannot** create, list, invite, or resend staff credentials.
- Staff never use `app.<root>`. First login, password change, and later campus work stay on the campus host.
- Staff cannot use director routes (**403**). Directors cannot change a staff password (**403**). Teachers cannot manage staff.

---

## 2. Schema-per-tenant

```text
one database
├── platform              tenants (director identity), platform admins
├── tenant_demo           teachers, staff, later classes / grades
└── tenant_north_hall     staff for slug north-hall
```

- Table name: `staff`
- Same columns as `teachers`
- Unique `email` per schema. Unique `employee_id` where not null
- Person numbers live in `id_counters` with role `F`. Existing campuses alter `id_counters_role_check` to `role in ('T', 'S', 'F')`

The table is ensured when the school schema exists (`claimSlug`) and on first staff use.

---

## 3. Ethiopian fields

Same form as teachers: given / father / grandfather, sex `male`|`female`, Ethiopian mobile, email. The school does not type an ID. On insert the server assigns `AAAF/00001/26` (role `F`). `displayName` is derived.

Invalid name, sex, phone, or email → **400**. Abbreviation still null → **409** `Set the school abbreviation in Settings first.`

---

## 4. Invite flow

Same honesty model as teacher credentials:

1. Director submits `/staff/new`.
2. Server hashes a temporary password, inserts with `mustChangePassword: true`, and emails **Staff account** copy on the campus cream/brick letter (`campus-mail`, same surface as teacher and student mail — not the admin Schools-console director letter).
3. Create still **201s** if mail fails. Credentials: `{ email, password, loginUrl, schoolId }`.
4. Staff signs in on campus `/login` with **email or school ID**. Session `kind: "staff"`. Session email is still the account email.
5. First login must change password (`POST /school-staff/password`). Min 12 characters; new password must not equal the current password.
6. **Resend** only while `mustChangePassword`. After campus sign-in, staff stay on `/login` (password step or “You’re in” home).

---

## 5. HTTP (campus host only)

Same host rules as `/school-teachers`. Wrong host → **403**. Missing/kind-less session → **401**. Wrong `kind` → **403**.

| Method | Path | Session | Purpose |
|---|---|---|---|
| POST | `/school-staff` | director | Create |
| GET | `/school-staff` | director | List newest first `{ staff: StaffAdminView[] }` |
| POST | `/school-staff/:id/resend-credentials` | director | Resend |
| POST | `/school-staff/password` | staff | First password |

Campus sign-in (`POST /school-accounts/campus-session`) looks up email as director, then teacher, then staff. School ID role `F` → staff. Role `S` → generic **401**.

---

## 6. Uniqueness

Staff `email` is unique **inside that school**. Create rejects the address, with the same generic string, when it:

- already belongs to a staff member in this school, or
- already belongs to a teacher in this school, or
- equals this school's director email, or
- equals `PLATFORM_ADMIN_EMAIL`

**409** `This email cannot be used.`

`create-teacher` also rejects a staff email in that school with the same **409**.

---

## 7. Frontend

- Director `/staff` is the roster (name, email, ID, mail status, resend). **Add a staff member** opens `/staff/new`. Not a sidebar item. Sidebar stays Dashboard, Teachers, Staff, Settings.
- `useStaffStore` — list + create draft + credentials reveal. `resetDraft()` on leave of `/staff/new`. `reset()` on campus sign-out.
- Campus `/login`: `parseCampusAccountKind` accepts `"staff"`. Staff use the password step, then “A staff workspace will be here later.”

---

## 8. Change log

| Date | Change |
|---|---|
| 2026-09-07 | First version. Director creates staff in `tenant_<slug>.staff`. Printed ID role `F` (`AAAF/00001/26`). Campus session `kind: "staff"`. Same email uniqueness 409 as teachers. |
| 2026-09-07 | Staff credentials HTML mail uses the campus cream/brick letter (`campus-mail`), not the admin director letter. |
