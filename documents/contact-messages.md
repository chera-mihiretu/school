# Contact messages

Living document.  
Started: 2026-09-06  
Last updated: 2026-09-06

Public landing visitors write to the platform from the apex contact form. Operators read those notes in the admin console. This is **not** tenant create and **not** an account.

Root host: `e-school.et`.

---

## Table

Schema: `platform`. Applied on backend start (`ensureSchema` in the contact-message store).

SQL lives in `backend/src/infrastructure/persistence/contact-message-store.ts`.

```sql
create schema if not exists platform;

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
);
```

| Column | Notes |
|---|---|
| `id` | UUID, generated |
| `school_name` | Required. From public body `school` |
| `sender_name` | Required. From public body `name` |
| `role` | Optional |
| `email` | Required, validated |
| `note` | Optional; stored as empty string when omitted |
| `phone` | Optional. The public form does not collect it |
| `created_at` | Exposed as `created` (ISO-8601) |
| `acted_at` | Null until an operator marks the note acted. Exposed as `acted` (boolean) |

---

## Endpoints

### Public (no auth)

Any host may post. This does not create a school or a login.

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/public/contact` | `{ school, name, role?, email, note? }` | **201** `{ ok: true }` |

Required: `school`, `name`, `email`. Invalid or missing fields → **400** `{ error }`. Invalid JSON → **400**.

### Admin (HMAC session, admin host only)

Same session as `/admin/session`: `Authorization: Bearer <token>`. The Next console sends `x-school-host` because the backend `Host` is the compose service name.

Wrong or missing session → **401**. Host is not `admin.<root>` → **403**.

| Method | Path | Response |
|---|---|---|
| GET | `/admin/contact-messages` | `{ messages, page, pageSize, total, pending }` |
| POST | `/admin/contact-messages/:id/act` | `{ message }` |

Unacted first, then newest. Optional query: `page` (default 1), `pageSize` (default 50, max 100). `pending` is the count of unacted notes.

Each message: `{ id, school, name, role, email, note, phone, created, acted }`.

Act is idempotent. Unknown id → **404**. The inbox does not dump the note in the list: operators open a row with **Act on**, then reply and **Mark acted**.

---

## Phone display

Contact-us surfaces show the Ethiopia number **0968590369** in international form with a small ET flag:

`[ET flag] +251 968 590 369`

The local `0968590369` may sit next to it. Country code is 251; drop the leading 0.

Surfaces: apex landing `#contact`, dedicated `/contact` (apex host only), flag file `frontend/public/flags/et.svg`.

---

## Frontend

| Surface | Path |
|---|---|
| Landing form | `/` on `e-school.et`, section `#contact` |
| Dedicated page | `/contact` on the apex host only |
| Operator inbox | `/platform-admin/messages` (sidebar: Messages). Each row has **Act on**. |
| Dashboard | When `pending > 0`, primary button **Act on N messages** |

The form uses a server action that POSTs to `${BACKEND_URL}/public/contact`. Success keeps the existing thank-you copy. Failure shows an error. Zustand holds `sentTo` / `error` / `pending`.

The inbox is admin-host only. Empty copy: “No messages yet.” Do not invent rows.

---

## Layers

| Layer | Files |
|---|---|
| Domain | `domain/contact-messages/*`, `domain/ports/contact-message-store-port.ts` |
| Application | `application/contact-messages/*` |
| Infrastructure | `infrastructure/persistence/contact-message-store.ts` |
| HTTP | `interfaces/http/create-app.ts` |
| Composition | `composition/container.ts` |

---

## Change log

| Date | Change |
|---|---|
| 2026-09-06 | `platform.contact_messages` + public POST and admin GET. Phone display +251 968 590 369 with ET flag. |
| 2026-09-06 | Act-on workflow: `acted_at`, `POST /admin/contact-messages/:id/act`, inbox button + dashboard CTA. Unacted listed first. |
