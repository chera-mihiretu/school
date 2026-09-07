# School abbreviation and person IDs

Living document. Update when the unique three-letter school code or generated person IDs change.
Started: 2026-09-07
Last updated: 2026-09-07

This document is the **approved contract** for school abbreviations and printed person IDs. Backend and frontend implement against it. If a later code detail disagrees, this file wins.

It covers the globally unique three-letter code on `platform.tenants`, first-login step 3, campus Settings, and auto-issued teacher and staff IDs. Students are **not** a product yet. The `S` form is reserved so Settings and first-login can preview `AAAS/00001/26`. Teacher IDs (`AAAT/00001/26`) and staff IDs (`AAAF/00001/26`) are campus login identifiers. Student-shaped IDs are not accounts; campus sign-in treats them as a wrong password.

---

## 1. What the code is

Every school has at most one abbreviation: exactly three letters `A–Z`, stored uppercase.

- Unique across the platform. No two schools share a code.
- Default assignment is first come, first served: `AAA`, then `AAB`, … `AAZ`, `ABA`, … `ZZZ`.
- The director may type any unused three-letter code on the **first save**.
- The first save locks the code for life, including if they keep the suggested default.
- The platform operator cannot set or change it.
- School-name letters (`AL` from Abdi Lemi) are **not** used.

Printed person IDs:

```text
AAAT/00001/26   teacher
AAAS/00001/26   student (reserved)
AAAF/00001/26   staff
```

`T`, `S`, or `F` is stuck to the three letters. The middle number is five digits, zero-padded, auto-incremented. The year is the Gregorian two-digit year in `Africa/Addis_Ababa` at create time. The school never types an ID.

Counters are **per school, per role, per year**. First teacher in 2026 is `AAAT/00001/26`. First staff in 2026 is `AAAF/00001/26`. First teacher in 2027 is `AAAT/00001/27`. Existing `employee_id` values stay as they are; only new rows get a generated ID.

If `ZZZ` is taken and nothing is left → **409** `No school abbreviations are left.`

---

## 2. Where it is stored

Abbreviation is **platform identity**, not tenant-schema data.

- `platform.tenants.abbreviation` — nullable until the first save, unique on `upper(abbreviation)` where not null.
- Null means unset. Non-null means locked.
- Person numbers live in `tenant_<slug>.id_counters` (`role` `T`|`S`|`F`, `year_yy`, `last_n`). Existing campuses alter `id_counters_role_check` to include `F`.
- Generated teacher IDs are stored as `tenant_<slug>.teachers.employee_id` (unique where not null).
- Generated staff IDs are stored as `tenant_<slug>.staff.employee_id` (unique where not null).

Domain owns `nextAbbreviation(taken)`, `formatPersonId`, and `personIdYearYy`. HTTP and React do not invent codes.

---

## 3. First login (new schools)

Order on `app.{root}`: password → username → **abbreviation** → campus.

[`SchoolAccountNextStep`](../backend/src/domain/school-accounts/session.ts) is `"password" | "username" | "abbreviation"`:

1. `mustChangePassword` → `password`
2. `slug === null` → `username`
3. `abbreviation === null` → `abbreviation`
4. else app setup is done: sign-in **403** “Use your campus host”; `GET /school-accounts/session` **401**

After username claim the app session **stays valid**. The browser goes to `/first-login/abbreviation`, not campus. After abbreviation save the app cookie is destroyed and the browser goes to `{slug}.{root}`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/school-accounts/abbreviation` | Preview (`suggested`, `examples`) plus optional `?code=` lookup |
| POST | `/school-accounts/abbreviation` | First save. Empty body uses `nextUnused`. Custom code must be free |

Preview does **not** reserve the code. Save uses the unique index. A custom duplicate → **409** `This abbreviation is already used.` A collision on the suggested default is retried by asking again (client shows the new suggestion).

---

## 4. Campus Settings (existing schools)

Schools that already claimed a username (Abdi Lemi and others) never see first-login again. The director opens **Settings** on `{slug}.{root}`.

Director session (`kind: "director"`) only. Teacher → **403**. Unsigned → **401**. Wrong host → **403**.

| Method | Path | Purpose |
|---|---|---|
| GET | `/school-settings/abbreviation` | `{ abbreviation, locked, suggested, examples }` and optional `?code=` |
| POST | `/school-settings/abbreviation` | Same claim rules. Already set → **409** |

Unlocked: suggested next unused code, editable once. Locked: read-only letters and example IDs.

Teacher or staff create without an abbreviation → **409** `Set the school abbreviation in Settings first.`

Nav: Dashboard, Teachers, Staff, Settings.

---

## 5. Teacher and staff create

`POST /school-teachers` and `POST /school-staff` do not accept `employeeId`. The use case reads the tenant abbreviation, allocates `nextPersonNumber(slug, "T" | "F", yy)`, and stores `formatPersonId`. That printed ID is emailed with the temporary password and accepted on campus `/login`.

---

## 6. Change log

| Date | Change |
|---|---|
| 2026-09-07 | Staff IDs (`AAAF/00001/26`). `id_counters` role `F`. See `staff.md`. |
| 2026-09-07 | Teacher IDs (`AAAT/00001/26`) are campus login identifiers and are included in the credentials email. Student IDs stay reserved. |
| 2026-09-07 | Unique `AAA`…`ZZZ` school codes. One save locks for life. IDs `AAAT/00001/26`. First-login step 3 and campus Settings. Teacher IDs are generated. Students reserved. |
