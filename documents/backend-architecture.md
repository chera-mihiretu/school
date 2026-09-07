# Backend architecture

Living document. Update when the backend structure or DI rules change.  
Started: 2026-09-05  
Last updated: 2026-09-06 (school-account first login)

This is the skeleton we implement against. Platform-admin behavior stays in `platform-admin.md`. Tenant use cases are not built yet.

---

## Clean Architecture

Dependencies point inward. Outer rings may import inner rings. Inner rings never import outer rings.

```text
interfaces/http        HTTP adapters (Node http)
infrastructure         Pino, config, Postgres.js (`DATABASE_URL`)
composition            Awilix composition root (only place that knows Awilix)
        ↓
application            use cases (getHealth, sign-in, read session)
        ↓
domain                 types and ports (Health, LoggerPort, session ports)
```

| Layer | May import | Must not import |
|---|---|---|
| `domain` | nothing from the rest of the app | Awilix, Pino, Node `http`, Postgres |
| `application` | `domain` | Awilix, Pino, Node `http`, Postgres |
| `infrastructure` | `domain` (and ports it implements) | `interfaces`, `application` use cases |
| `interfaces` | `application`, `domain` | Awilix, Pino, Postgres |
| `composition` | all layers | — |

---

## Dependency injection

Package: **Awilix 13** (latest at setup). No decorators, no `reflect-metadata`. That matches TypeScript `erasableSyntaxOnly`.

Rules:

- Register everything in `src/composition/container.ts`.
- Use `InjectionMode.PROXY` and `strict: true`.
- Register with `asFunction` / `asValue`. Do not use constructor-parameter name matching (`CLASSIC`) or parameter properties.
- Domain and application files must not import `awilix`.
- Request-scoped registrations can be added later with `container.createScope()` when we have per-request tenant `search_path`. v1 health is singleton.

---

## Current wiring

- `config` — `loadConfig()` including `DATABASE_URL`
- `logger` — Pino behind `LoggerPort`
- `database` — Postgres.js behind `DatabasePort` (see `database.md`)
- `getHealth` — application use case (pings `DatabasePort`)
- `seedFirstAdmin` — insert first `platform.admins` row from env (skipped if any admin exists)
- `signInPlatformAdmin` / `readPlatformAdminSession` — Argon2id store + HMAC session
- `featuredSchoolStore` / featured-school use cases — public directory (`platform.featured_schools`)
- `contactMessageStore` / contact-message use cases — public POST + admin inbox (`platform.contact_messages`)
- `httpServer` — HTTP adapter for `/health`, `/admin/session`, `/school-accounts/session`, `/school-accounts/password`, `/public/resolve`, `/public/featured-schools`, `/admin/featured-schools`, `/public/contact`, `/admin/contact-messages`, `/admin/tenants`
- `signInSchoolAccount` / `readSchoolAccountSession` / `changeSchoolAccountPassword` — app-host first login (HMAC `{ accountId, email, exp }`, not the admin signer)
- `tenantStore` / `listAdminTenants` / `createTenant` — paginated `GET /admin/tenants`; `POST /admin/tenants` is `insertPending` (name + email, Argon2id, SMTP)
- `mailer` — `MailerPort` via Nodemailer SMTP (`createSmtpMailer`)
- `passwordGenerator` — `node:crypto` in infrastructure
- `resolvePublicHost` — Host header → landing kind (`apex` / `admin` / `app` / `campus` / `suspended` / `unknown`). Tenant directory is empty until school tenants are stored.

---

## Change log

| Date | Change |
|---|---|
| 2026-09-06 | School-account first login: `/school-accounts/session` and `/school-accounts/password` on `app.{root}`. See `school-accounts.md`. |
| 2026-09-06 | Contact messages: public POST `/public/contact`, admin GET `/admin/contact-messages`. See `contact-messages.md`. |
| 2026-09-05 | Clean Architecture folders + Awilix 13 composition root. Health is the first wired use case. |
| 2026-09-05 | Postgres via `DATABASE_URL` only. Swap Neon/Supabase/local by env. |
| 2026-09-05 | Platform-admin session use cases + `/admin/session`. Bootstrap identity from env. |
| 2026-09-05 | First-admin seed + Argon2id hashes in `platform.admins`. |
| 2026-09-06 | `GET /public/resolve` — public host resolution for landings. See `public-host-resolution.md`. |
| 2026-09-06 | `MailerPort` + Nodemailer SMTP. `POST /admin/tenants` creates `pending_setup` and emails first-login credentials. See `platform-admin.md`. |
| 2026-09-06 | `GET /admin/tenants` pagination from `platform.tenants`. See `platform-admin.md`. |
| 2026-09-06 | Featured-school directory (public GET + admin CRUD). See `featured-schools.md`. |
