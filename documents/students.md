# Students

Living document. Update when director- or staff-created student accounts or campus student session behavior changes.
Started: 2026-09-07
Last updated: 2026-09-07

This document is the **approved contract** for school student accounts. Backend and frontend implement against it. If a later code detail disagrees, this file wins.

It covers students created by a **school director or office staff** on that school's campus host. It does not cover the platform operator (`platform-admin.md`) or the director's first login on `app` (`school-accounts.md`). Students are learner accounts (`S` printed IDs). There is **no student portal** yet: after campus sign-in they stay on `/login` (password step or “You’re in”).

---

## 0. Subdomain is tenancy, session is identity

The Host header / `{slug}.e-school.et` **selects the tenant**. Privileged UI and APIs require a campus session (`school_account_session`) with an explicit `kind`.

| Role | Host | Session |
|---|---|---|
| Platform admin | `admin.{root}` | `platform_admin_session` only |
| School director | `{slug}.{root}` | campus cookie `kind: "director"` |
| Teacher | `{slug}.{root}` | campus cookie `kind: "teacher"` |
| Staff | `{slug}.{root}` | campus cookie `kind: "staff"` |
| Student | `{slug}.{root}` | campus cookie `kind: "student"` |

Campus HMAC payload is `{ accountId, email, exp, kind }`. Kind-less tokens are **401**.

---

## 1. Who creates them

**Director and staff** can both list and create students for **that school only**. Teachers cannot. The platform operator cannot. Students cannot create other students.

- A student belongs to one school (`tenant_<slug>.students`).
- Students never use `app.<root>`. Invite, first password, and later campus work stay on the campus host.
- Staff cannot use director-only routes (Teachers, Staff roster, Settings) — **403** / redirect to staff Dashboard.
- Directors cannot change a student password (**403**). Staff cannot either. Only the student session can `POST /school-students/password`.

---

## 2. Workspace and navigation

### Staff shell

After staff change their temporary password they leave `/login` and enter a campus sidebar (same cream/maroon shell as the director, different items):

| Item | Path |
|---|---|
| Dashboard | `/dashboard` |
| Students | `/students` |

**Add a student** is a button on the list (and on the staff dashboard), not a sidebar item. `/students/new` is not in the nav. Staff nav is active on exact `/dashboard` and exact `/students` only (same pattern as director Teachers).

Staff Dashboard: school name, student count, **Add a student**. Not the director teacher-count dashboard.

### Director shell

Director sidebar becomes:

Dashboard, Teachers, Staff, **Students**, Settings.

Same Students list/create pages as staff. Director Dashboard stays teacher-count + **Add a teacher** (no required student count there). Teachers, Staff, Settings stay director-only.

### Shared student pages

`/students` and `/students/new` allow `kind: "director"` or `kind: "staff"`. The page body is the same; only the surrounding sidebar changes.

A teacher or student session on those routes redirects to `/login`.

### After student sign-in

Signed-in **student** stays on `/login` (password change, then a “You’re in” home). They never see the director or staff shell. `/students` is an office roster, not a student portal.

---

## 3. Schema-per-tenant

```text
one database
├── platform              tenants, platform admins
├── tenant_demo           teachers, staff, students, id_counters
└── tenant_north_hall     students for slug north-hall
```

- Table name: `students`
- Same columns as `teachers` / `staff`, except **`phone` is nullable**
- Unique `email` per schema. Unique `employee_id` where not null
- Person numbers live in `id_counters` with role `S` (already allowed: `'T' | 'S' | 'F'`)

The table is ensured when the school schema exists (`claimSlug`) and on first student use.

```sql
phone text
```

Empty create input → SQL `NULL`. Do not store `""`.

---

## 4. Ethiopian fields

Create accepts the three Ethiopian names, sex, optional phone, and email. The school **does not type** an ID. On insert the server assigns `AAAS/00001/26` (role `S`). `displayName` is derived.

| Field | Required | Rules |
|---|---|---|
| `givenName` | yes | Person's own name |
| `fatherName` | yes | Father's name |
| `grandfatherName` | yes | Grandfather's name |
| `displayName` | derived | `{givenName} {fatherName} {grandfatherName}` |
| `sex` | yes | `male` or `female` only |
| `phone` | **no** | Empty → `null`. If present, E.164 Ethiopia mobile (`+251` then `9` or `7`, then 8 digits) |
| `email` | yes | Unique in that school. See section 7 |
| `employeeId` | assigned | Printed school ID `AAAS/#####/YY` |

Invalid name, sex, email, or a non-empty invalid phone → **400**. Abbreviation still null → **409** `Set the school abbreviation in Settings first.`

---

## 5. Invite flow

Same honesty model as teacher/staff credentials:

1. Director or staff submits `/students/new`.
2. Server hashes a temporary password, inserts with `mustChangePassword: true`, and emails **Student account** copy on the campus cream/brick letter (`campus-mail`, already implemented — not the admin director letter).
3. Create still **201s** if mail fails. Credentials: `{ email, password, loginUrl, schoolId }`.
4. Student signs in on campus `/login` with **email or school ID**. Session `kind: "student"`. Session email is still the account email.
5. First login must change password (`POST /school-students/password`). Min 12 characters; new password must not equal the current password.
6. **Resend** only while `mustChangePassword`.
7. First successful campus sign-in records `signedInAt` (not overwritten later).

---

## 6. HTTP (campus host only)

Same host rules as `/school-teachers`. Wrong host → **403**. Missing/kind-less session → **401**. Wrong `kind` → **403**.

| Method | Path | Session | Purpose |
|---|---|---|---|
| POST | `/school-students` | director **or** staff | Create |
| GET | `/school-students` | director **or** staff | List newest first `{ students: StudentAdminView[] }` |
| POST | `/school-students/:id/resend-credentials` | director **or** staff | Resend |
| POST | `/school-students/password` | student | First password |

Authorize create/list/resend with a **director-or-staff** check (not director-only). Teacher and student sessions are **403**.

Campus sign-in (`POST /school-accounts/campus-session`) looks up email as director, then teacher, then staff, **then student**. School ID role `S` → student store. Role `T` → teacher. Role `F` → staff.

---

## 7. Uniqueness

Student `email` is unique **inside that school**. Create rejects the address, with the same generic string, when it:

- already belongs to a student in this school, or
- already belongs to a staff member in this school, or
- already belongs to a teacher in this school, or
- equals this school's director email, or
- equals `PLATFORM_ADMIN_EMAIL`

**409** `This email cannot be used.`

`create-teacher` and `create-staff` also reject a student email in that school with the same **409**.

---

## 8. Frontend

- `requireCampusOffice` (name in code may vary): campus host + session `kind` director or staff. Used by `/students`, `/students/new`, and the staff `/dashboard`.
- Director `/dashboard`, `/teachers`, `/staff`, `/settings` stay `requireCampusDirector`.
- `/dashboard` is **shared**: director sees the existing teacher dashboard in the director shell; staff sees the staff dashboard in the staff shell. One URL, two layouts — do not keep `/dashboard` inside a director-only route group.
- `useStudentsStore` — list + create draft (phone optional) + credentials reveal. `resetDraft()` on leave of `/students/new`. `reset()` on campus sign-out.
- Campus `/login`: `parseCampusAccountKind` accepts `"student"`. Director and staff redirect to `/dashboard`. Teacher stays on `/login`. Student stays on `/login`.

---

## 9. Out of scope

- Student portal / classes / grades / payments
- Platform operator creating or listing students
- Putting **Add** in either sidebar
- Changing the director credentials (admin) email letter
- Making teacher or staff phone optional

---

## 10. Change log

| Date | Change |
|---|---|
| 2026-09-07 | First version. Director and staff create students in `tenant_<slug>.students`. Printed ID role `S` (`AAAS/00001/26`). Campus session `kind: "student"`. Phone optional. Staff sidebar: Dashboard + Students. Director sidebar gains Students. Shared `/students` and `/students/new`. |
