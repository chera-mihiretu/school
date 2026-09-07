# Featured schools

Living document.  
Started: 2026-09-06  
Last updated: 2026-09-06 (how to try it)

This is the **public “schools on our platform” directory**. Landing guests see published rows. Platform admins add and edit the list.

It is **not** tenant provisioning. Creating a featured row does not create a `tenant_<slug>` schema, school users, or a live campus. Tenant create stays in `platform-admin.md`.

Root host: `e-school.et` (`config.auth.rootHost`, port stripped from `APP_HOST`). Directory addresses are shown as `{slug}.e-school.et`.

---

## Table

Schema: `platform`. Applied on backend start (`ensureSchema` in the featured-school store). There is no separate migration runner.

SQL lives in `backend/src/infrastructure/persistence/featured-school-store.ts`.

```sql
create schema if not exists platform;

create table if not exists platform.featured_schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  sort_order integer not null default 0,
  published boolean not null default true
);
```

| Column | Notes |
|---|---|
| `id` | UUID, generated |
| `name` | Display name |
| `slug` | Unique DNS label. Shown as `{slug}.{rootHost}` |
| `created_at` | Exposed as `created` (ISO-8601) |
| `sort_order` | Lower first. New rows get `max(sort_order) + 1` |
| `published` | Guests only see `true`. Default `true` on create |

---

## Endpoints

### Public (no auth)

Landing guests call this. Any host may hit it.

| Method | Path | Response |
|---|---|---|
| GET | `/public/featured-schools` | `{ schools: Array<{ id, name, slug, created, host }> }` |

- Only `published = true`.
- Order: `sort_order` ascending, then `created_at` ascending.
- `host` is `${slug}.${rootHost}` (`config.auth.rootHost`, port stripped from `APP_HOST`).

### Admin (HMAC session, admin host only)

Same session as `/admin/session`: `Authorization: Bearer <token>`. The Next console sends `x-school-host` because the backend `Host` is the compose service name.

Wrong or missing session → **401**. Host is not `admin.<root>` → **403**. School hosts cannot manage the directory even with a stolen token.

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/admin/featured-schools` | — | `{ schools: Array<{ id, name, slug, created, host, published, sort_order }> }` (all rows) |
| POST | `/admin/featured-schools` | `{ name, slug }` | **201** `{ school }` |
| PATCH | `/admin/featured-schools/:id` | `{ name?, slug?, published?, sort_order? }` | `{ school }` |
| DELETE | `/admin/featured-schools/:id` | — | `{ ok: true }` |

Slug rules match the landing/console helper `isValidSchoolSlug`: lowercase letters, digits, hyphens; must start and end with a letter or digit. Reserved: `admin`, `www`, `api`, `app`, `mail`, `ftp`.

| Status | When |
|---|---|
| 400 | Invalid JSON, empty name, invalid/reserved slug, empty PATCH, non-integer `sort_order` |
| 401 | Missing or invalid Bearer session |
| 403 | Not the admin host |
| 404 | Unknown `:id` |
| 409 | Slug already listed |

---

## Landing

The apex landing page must load the directory from **GET `/public/featured-schools`**. Do not hardcode school names. Unpublished rows stay off the public list until an admin sets `published: true`.

### Frontend

| Surface | Path |
|---|---|
| Landing directory | `/` on `e-school.et`, section `#directory` (below What we do, above Contact) |
| Next public proxy | `GET /public/featured-schools` (Zustand `loadPublic`) |
| Operator UI | `/platform-admin/featured` (sidebar: Featured) |

`src/app/page.tsx` calls `listPublicFeaturedSchools()` — a server-only fetch to `${BACKEND_URL}/public/featured-schools` (`cache: "no-store"`). `ApexView` hydrates `useFeaturedSchoolsStore` with that list and renders from the store. A failed backend returns `[]`; `DEMO_NETWORK` is not used.

Admin add/unpublish are server actions: Bearer session + `x-school-host` against `/admin/featured-schools`. They `revalidatePath("/")`.

Empty states: landing “No schools listed yet.” · console “No schools yet”. No invented campuses.

---

## How to try it

1. Sign in at `http://admin.e-school.et:3000/platform-admin/login`.
2. Open **Featured** in the sidebar (`/platform-admin/featured`).
3. Add a school name and slug, then submit **Add to directory**.
4. Open `http://e-school.et:3000/` — the row appears under Schools on the network (`#directory`).

Unpublish on the Featured page removes the row. First paint is a server fetch; the client then keeps the list in Zustand (same store as the admin Featured form).

---

## Layers

| Layer | Files |
|---|---|
| Domain | `domain/featured-schools/*`, `domain/ports/featured-school-store-port.ts` |
| Application | `application/featured-schools/*` |
| Infrastructure | `infrastructure/persistence/featured-school-store.ts` (Postgres.js) |
| HTTP | `interfaces/http/create-app.ts` |
| Composition | `composition/container.ts` |

---

## Change log

| Date | Change |
|---|---|
| 2026-09-06 | `platform.featured_schools` + public GET and admin CRUD. Not tenant provisioning. |
| 2026-09-06 | How to try it: add in admin Featured, confirm on landing `#directory`. |
