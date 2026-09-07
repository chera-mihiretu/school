# Public host resolution

Living document. Update when host -> landing behavior changes.  
Started: 2026-09-06  
Last updated: 2026-09-07 (starting campus public landing)

Every public visit is resolved from the **Host** header. That is how each tenant gets its own landing page. The operator console is one of those landings, not a special-case redirect.

**Subdomain is tenancy, session is identity.** Host only chooses the public view. Privileged consoles still need their session cookie (`platform_admin_session` or campus `school_account_session` with `kind`).

---

## Views

| Host | `kind` | Landing |
|---|---|---|
| `e-school.et` (and `www`) | `apex` | Network home |
| `admin.e-school.et` | `admin` | Operator landing with **Log in** |
| `app.e-school.et` | `app` | App landing with **Log in** → `/first-login` |
| `{slug}.e-school.et` (active tenant) | `campus` | Signed out: starting-school public landing (top nav with school monogram + School lockup, about / address / staff, **Log in**). Signed-in **director**: redirect to `/dashboard`. Signed-in **teacher**: this public landing; session UI stays on `/login` (`teachers.md`). Custom CMS later. |
| `{slug}.e-school.et` (suspended) | `suspended` | Unavailable campus |
| unknown or reserved label | `unknown` | No school at this address |

`admin` and `app` are reserved. They are never school tenants. Resolution returns `kind: "admin"` or `kind: "app"` **before** a reserved label becomes `unknown`. A tenant without a slug (`pending_setup`) is not a public host.

---

## API

`GET /public/resolve` (no auth). Host comes from `Host` or `x-school-host`.

Examples:

```json
{ "kind": "admin", "host": "admin.e-school.et", "rootHost": "e-school.et" }
```

```json
{ "kind": "apex", "host": "e-school.et", "rootHost": "e-school.et" }
```

Campus and suspended payloads also include `name`, `slug`, `founded`, `monogram`. Tenant lookup is a `TenantDirectoryPort`. Until school tenants are stored, unknown slugs resolve to `unknown`.

The Next app’s `/` server component calls this endpoint (`cache: "no-store"`). If the backend is down, it falls back to `resolvePublicSchoolView` in `frontend/src/lib/network.ts`.

---

## Login

The **Log in** button belongs on the landing that resolution chose.

- Admin landing → `/platform-admin/login` on `admin.<root>`
- App landing → `/first-login` on `app.<root>` (email + temporary password, then change password, then claim a username)
- Campus landing -> `/login` on `{slug}.<root>` (director: password chosen on first login; teacher: invite password). Teachers never use `app`.
- The apex is the network pitch. It is not a login page.

A signed-in operator who opens `admin.<root>/` is sent to `/platform-admin`.
A signed-in school director who opens `app.<root>/` is sent to `/first-login` (or `/first-login/username` when that is the next step). After a username is claimed the app session is gone; they sign in again on the campus host.
A signed-in **director** who opens `{slug}.<root>/` is sent to **`/dashboard`**, not a fake marketing landing. See `teachers.md`.
A signed-in **teacher** stays on campus (`kind: "teacher"`). If `mustChangePassword`, they change password before anything else.
Local wildcard DNS (`dns` service + `./setup-hosts.sh`) resolves every `{slug}.e-school.et` to loopback. Do not add campus slugs to the hosts file.

---

## Change log

| Date | Change |
|---|---|
| 2026-09-07 | Starting campus `/` is a public landing: sticky top nav (school monogram + name, section links, School lockup to the network home, **Log in**), honest opening copy, address, and staff door. No invented programmes or news. Custom CMS still later. |
| 2026-09-07 | Signed-in director on campus `/` redirects to `/dashboard`. Campus `/login` accepts director or teacher; a signed-in director there also goes to `/dashboard`. See `teachers.md`. |
| 2026-09-07 | Active campus `/` shows the tenant name (from slug) and **Log in** -> `/login`. Placeholder marketing blocks removed until the site is customized. |
| 2026-09-07 | Local CoreDNS answers `*.e-school.et`. `./setup-hosts.sh` once; no per-slug hosts entries. |
| 2026-09-06 | `app` landing shows Log in. First login and password change live on `/first-login`. Username claim is later. See `school-accounts.md`. |
| 2026-09-06 | `app.e-school.et` resolves to `kind: "app"`. `app` stays a reserved tenant slug. |
| 2026-09-06 | Public resolve (`GET /public/resolve`). Admin host is a landing with Log in, same path as future school landings. |
