# School accounts

Living document. Update when first-login or school-director session behavior changes.  
Started: 2026-09-06  
Last updated: 2026-09-07 (staff roster + campus kind)

This document covers the **school director account**: first login on `app.<root>`, the permanent username claim, and campus sign-in on `{slug}.<root>`. Campus `/login` is now **director or teacher** (`kind` on the session). Teacher create, roster, and teacher password change live in `teachers.md`. It does not cover the platform operator (`platform-admin.md`). Students have **no campus console** yet.

---

## 0. Subdomain is tenancy, session is identity

The Host header / `{slug}.e-school.et` **selects the tenant**. It is **not** a credential. There is no “if you are on this host you are the director.”

Privileged campus UI and APIs require `school_account_session` (HMAC, httpOnly, host-only, no `Domain=`, SameSite=lax) with an explicit `kind`. App first-login tokens omit `kind` and are valid **only** on `app.<root>`. The same token on a campus host is **401**.

| Role | Host | Session |
|---|---|---|
| Platform admin | `admin.{root}` | `platform_admin_session` only |
| School director | `{slug}.{root}` | campus cookie `kind: "director"` |
| Teacher | `{slug}.{root}` | campus cookie `kind: "teacher"` |
| Student | — | not built; `/students` redirects to `/login` |

Public may stay on the subdomain without a session: campus landing `/` (name + Log in), apex, unknown/suspended views.

---

## 1. Who this person is

The school director receives credentials after an operator creates a `pending_setup` tenant (name + email). Director email is unique across tenants. The platform admin address cannot be used; create returns the same generic error for a taken address or the admin address and does not distinguish them. The operator can **Resend credentials** while setup is unfinished: that generates a new temporary password, invalidates the previous one, and sends the same first-login mail again. They sign in on the app host, change the temporary password, claim a permanent username, save a three-letter school code, then sign in again on the campus host.

They are not a platform admin. An admin session cookie is not a school-account session. After campus sign-in the director opens **`/dashboard`** (sidebar: Dashboard + Teachers + Staff + Settings), not the public landing and not `/login`. Teachers are listed on `/teachers` and created on `/teachers/new` (opened from **Add a teacher**, not the sidebar). Staff are listed on `/staff` and created on `/staff/new` (opened from **Add a staff member**, not the sidebar). See `staff.md`. The three-letter school code is set on first-login or `/settings` (`school-abbreviation.md`).

---

## 2. Where they sign in

| Environment | First login | Campus |
|---|---|---|
| Local | `app.e-school.et:3000` | `{slug}.e-school.et:3000` |
| Production | `app.e-school.et` | `{slug}.e-school.et` |

`firstLoginUrl` is `publicUrl({ label: "app", path: "/first-login?email=" })` from `APP_PROTOCOL` + `APP_HOST` (hostname and public port together). Example: `APP_PROTOCOL=http`, `APP_HOST=e-school.et:3000` → `http://app.e-school.et:3000/first-login?email=`. Host matching uses the DNS root (`e-school.et`) with the port stripped. Container `NODE_ENV=production` does not switch the scheme.

After the abbreviation is saved, the browser does a full navigation to `publicUrl({ label: slug })` → `http://{slug}.e-school.et:3000`.

Rules:

- First login, username claim, and abbreviation save live **only** on the `app` host.
- `app` is never a school tenant slug.
- A tenant that already has a slug **and** an abbreviation must use its campus host.
- Session cookies are host-only. They must not be sent to `admin.<root>` or `{slug}.<root>` from `app`, or the other way around.
- Locally, `*.e-school.et` is answered by CoreDNS as `127.0.0.1`. Run `./setup-hosts.sh`, then run `C:\Users\Public\school-setup-hosts.bat` as administrator once. That adds a Windows NRPT rule so Chrome asks CoreDNS on the WSL IP (not Windows `127.0.0.1:53`, which Internet Connection Sharing / a phone hotspot already owns). The hosts file still lists only apex, www, admin, and app. Until NRPT is applied, use the Desktop **e-school** shortcut, and turn off Chrome **Use secure DNS**.

---

## 3. Flow

1. Public resolve `kind: "app"` → landing with **Log in** → `/first-login`.
2. Sign in with email + temporary password.
3. Server-enforced `nextStep`: `"password"` \| `"username"` \| `"abbreviation"`.
4. Change password on `/first-login` (min 12 characters, must not equal the current password).
5. Username step on `/first-login/username` when `nextStep === "username"`. Cannot open that route otherwise (redirects to `/first-login`).
6. Abbreviation step on `/first-login/abbreviation` when `nextStep === "abbreviation"` (after the slug, before campus). See `school-abbreviation.md`.
7. Claim username is permanent. Abbreviation is a separate one-save lock. The UI requires confirmation before each submit.
8. On abbreviation success the app session is destroyed (DELETE + clear cookie) and the browser goes to the campus host with `window.location`. Opening `app.<root>` afterwards is signed out.
9. Campus landing **Log in** -> `/login` on that host. Director: email + the **new** password (same credentials on `app` are rejected). Teacher: email + the invite password from the director (teachers never use `app`). Session `kind` is `"director"` or `"teacher"`.
10. Signed-in **director** on campus `/` or `/login` is redirected to `/dashboard`. Teachers are listed on `/teachers` and created on `/teachers/new`. Staff are listed on `/staff` and created on `/staff/new`. The school code is set on `/settings` if first-login never ran. Signed-in **teacher** or **staff** stays on `/login` (password change via `POST /school-teachers/password` or `POST /school-staff/password`). See `teachers.md` and `staff.md`.

---

## 4. Session

Cookie name: **`school_account_session`**.

- Host-only (no `Domain=`)
- `httpOnly`
- `SameSite=lax`
- Set and cleared by the Next app

App first-login HMAC payload is `{ accountId, email, exp }` (no `kind`). Campus HMAC payload is `{ accountId, email, exp, kind }` where `kind` is `"director"`, `"teacher"`, or `"staff"`. It is a **different signer** from the admin cookie (`{ email, exp }`). A `platform_admin_session` token is rejected on school-account and campus routes. A kind-less school token is rejected on campus.

The same cookie name is safe on `app` and `{slug}` because it is host-only and cannot leak across those hosts.

```ts
type SchoolSessionClaims = { accountId: string; email: string; expiresAt: Date };

type SchoolSessionView = {
  accountId: string;
  email: string;
  expiresAt: string;
  mustChangePassword: boolean;
  nextStep: "password" | "username" | "abbreviation";
};
```

`nextStep` is `"password"` while `mustChangePassword` is true, `"username"` while the slug is null, otherwise `"abbreviation"`. After the abbreviation is saved, `GET /school-accounts/session` on `app` is **401**. A session minted before suspend is **403** on GET (same as sign-in / change-password / claim).

---

## 5. Backend routes

### App host (`app.{root}`) — 403 otherwise

| Method | Path | Purpose |
|---|---|---|
| POST | `/school-accounts/session` | Sign in (email + password) |
| GET | `/school-accounts/session` | Current session + `nextStep` |
| DELETE | `/school-accounts/session` | Sign out |
| POST | `/school-accounts/password` | Change password |
| GET | `/school-accounts/username?slug=` | Live username check (school session) |
| POST | `/school-accounts/username` | Claim username |
| GET | `/school-accounts/abbreviation` | Suggested code + optional `?code=` lookup |
| POST | `/school-accounts/abbreviation` | First save of the three-letter code |

Sign-in rules:

- Wrong host → 403
- Suspended → 403
- Slug **and** abbreviation already set → 403 (“Use your campus host”)
- Unknown email or wrong password → 401
- After login, if `mustChangePassword`, `nextStep` is `"password"` only
- After password and slug, `nextStep` is `"abbreviation"` until the code is saved
- First successful app sign-in records `signedInAt` (not overwritten later). This is the operator’s proof the director received the credentials. Gmail SMTP accept is **not** inbox delivery. If recording `signedInAt` throws, sign-in still returns the session.

Change password:

- Min 12 characters
- New password must not equal the current password
- Persist via `updatePassword` with `mustChangePassword: false`
- Then `nextStep` is `"username"`
- Session `expiresAt` stays the existing session lifetime (the use case does not mint `now()`)

Username lookup (school session) takes `accountId` from the session and uses the same availability helper as `GET /admin/tenants/username`: reserved (including `app`), invalid, taken. Results match. Unknown, suspended, or already-claimed accounts are rejected in the use case, not only at the HTTP gate.

Claim username:

```ts
type ClaimUsernameResult =
  | { ok: true; host: string; slug: string }
  | { ok: false; status: 400 | 403 | 409; error: string };
```

- School session required
- `mustChangePassword` → **409** “Change your password first”
- Success: `claimSlug` (set slug, status `active`, `CREATE SCHEMA tenant_<slug>` in one transaction). App session **remains valid**. Next step is abbreviation. See `school-abbreviation.md`.
- Second claim → `already_claimed` (**409**)

### Campus host (`{slug}.{root}` matching that account)

| Method | Path | Purpose |
|---|---|---|
| POST | `/school-accounts/campus-session` | Sign in (director email, or teacher/staff email / school ID) |
| GET | `/school-accounts/campus-session` | Current campus session (`kind` + `mustChangePassword`) |
| DELETE | `/school-accounts/campus-session` | Sign out |
| GET | `/school-settings/abbreviation` | Suggested code + optional `?code=` lookup (director) |
| POST | `/school-settings/abbreviation` | First save. Already set → **409** |

Campus session view includes `kind: "director" | "teacher" | "staff"` and `mustChangePassword`. Admin cookies are rejected.

- **Director:** `status === "active"`, `mustChangePassword === false` (already changed on `app`), host slug matches the account. Identifier is **email** (directors have no person ID).
- **Teacher:** tenant `active`, host slug matches the school. Identifier is **email or school ID**. `mustChangePassword` may be true on first campus login. Teachers never sign in on `app`. See `teachers.md`.
- **Staff:** same as teacher, with `kind: "staff"` and printed IDs `AAAF/00001/26`. See `staff.md`.

---

## 6. Frontend

- `requireAppHost` — 404 on any host that is not `app.{root}`
- `requireCampusHost` — 404 unless public resolve is `kind: "campus"`
- `/` with `kind: "app"` → `AppLandingView` + Log in
- `/` with `kind: "campus"` -> starting-school public landing (monogram, School lockup, about / address / staff) + Log in -> `/login` when signed out; signed-in **director** -> `/dashboard`; signed-in **teacher** still sees this public landing (session UI stays on `/login`)
- `/dashboard`, `/teachers`, `/teachers/new`, `/staff`, `/staff/new`, and `/settings` — campus host + director session only (`requireCampusDirector`). Wrong host 404s. Teacher, staff, or missing session -> `/login`.
- `/first-login` - sign-in and password change; redirects to `/first-login/username` or `/first-login/abbreviation` from `nextStep`
- `/first-login/username` — username claim; redirects to `/first-login` unless `nextStep === "username"`
- `/first-login/abbreviation` — three-letter school code; redirects unless `nextStep === "abbreviation"`. On save, `window.location` to campus.
- Zustand `useFirstLoginStore` holds email, password fields, slug, finding status, availability, permanence confirmation, pending, error, session view, and `nextStep`. Leaving the first-login tree clears password fields only (`clearSecrets`), not session / nextStep / slug.
- Zustand `useCampusLoginStore` holds campus sign-in `identifier` (email or school ID), password fields, and `reset()` on unmount. Session view also has `kind` and `mustChangePassword` (director, teacher, or staff). The login field is `type="text"` so IDs are not rejected.
- Zustand `useTeachersStore` is the director `/teachers` roster / resend and `/teachers/new` create draft. `useCampusDashboardStore` is the director shell drawer. See `teachers.md` and `zustand.md`.
- Do **not** put the first-login wizard or teacher create in `useCreateSchoolStore`

Username step UI:

- Address preview `{slug}.{rootHost}`
- Finding animation while checking availability (debounce 380ms)
- A large permanence panel and checkbox **before** submit: “I understand. This subdomain cannot be changed.”

---

## 7. Change log

| Date | Change |
|---|---|
| 2026-09-07 | Campus credentials HTML (teacher, staff, student) uses the cream/brick campus letter. Director invite mail stays the Schools console letter. |
| 2026-09-07 | Director sidebar no longer includes Add. `/teachers/new` is opened from Add a teacher. |
| 2026-09-07 | Director credentials HTML mail matches the Schools console, not the public landing. |
| 2026-09-07 | Campus `/login` accepts teacher email or school ID. Director login stays email-only. See `teachers.md`. |
| 2026-09-07 | Campus teachers: `/teachers` list and `/teachers/new` add, matching admin Schools / Create. |
| 2026-09-07 | Unique school abbreviation (`AAA`…`ZZZ`) after username, before campus. App session stays valid until the code is saved. Campus Settings for schools that already claimed a slug. See `school-abbreviation.md`. |
| 2026-09-07 | Starting campus `/` is a public landing with school monogram, School lockup, about / address / staff, and **Log in**. Signed-in director still goes to `/dashboard`. |
| 2026-09-07 | Director campus shell: `/dashboard` and `/teachers`. Signed-in director on `/` or `/login` redirects to `/dashboard`. Teachers never see that shell. |
| 2026-09-07 | Campus `/login` is director or teacher. Session includes `kind` and `mustChangePassword`. After campus sign-in the director opens `/dashboard`. Teacher accounts: `teachers.md`. |
| 2026-09-07 | Local `*.e-school.et` wildcard DNS (CoreDNS). `./setup-hosts.sh` once; campus slugs are not added to hosts. Desktop **e-school** shortcut maps every slug in Chrome/Edge until Windows NRPT is approved. |
| 2026-09-07 | Director email must be unique across tenants. The platform admin address is forbidden. Create checks before insert and before mail; both cases return the same generic error and do not mention admin. |
| 2026-09-07 | Operator resend resets the temp password and emails again. First successful app sign-in sets `signedInAt`. SMTP accepted ≠ delivered. Bounce mailboxes, Gmail API, ESP webhooks, and tracking pixels were not added: Gmail SMTP cannot confirm inbox, and the stack stays on Nodemailer (not the Resend ESP). |
| 2026-09-07 | Public URLs compose from `APP_PROTOCOL` + `APP_HOST` (`http` + `e-school.et:3000`). `PUBLIC_APP_ORIGIN` removed. Host matching strips the port. |
| 2026-09-06 | GET session rejects suspend; change-password keeps existing `expiresAt`; username lookup requires `accountId`. First-login store clears password fields on leave of the tree. |
| 2026-09-06 | Username claim on `app.<root>`, school-session username lookup, destroy app session, redirect to `{slug}.{root}:3000`. Campus `POST /school-accounts/campus-session` and `/login`. |
| 2026-09-06 | First login on `app.<root>`: session cookie `school_account_session`, sign-in, password change, holding screen for username. |
