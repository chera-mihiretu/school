# School API — Postman

Importable Collection v2.1 files for the backend HTTP API (`PORT` default `5000`). Live backend endpoints are documented across the **split** collections. There is **no monolith collection**.

## Import

1. Postman → **Import** → select `environments/School-API.local.postman_environment.json`
2. Select the environment **School API — Local** in the environment picker
3. Import **each** file under `collections/` (order does not matter; they share the environment)
4. Set `adminPassword` (and optionally `adminEmail`) to your local seed values. Do not commit secrets.
5. **Admin Session** → **Sign in platform admin** writes `accessToken` on 200
6. **School Accounts** → set `schoolEmail` / `schoolPassword` (temporary password from the tenant invite) → **Sign in school account** writes `schoolAccessToken` and `schoolAccountId` on 200
7. After username claim, **Campus Session** → **Sign in campus account** (director) writes `campusAccessToken` on 200
8. **School Teachers** → **Create teacher** writes `teacherId` / `teacherEmail` / `teacherPassword` on 201. Sign in that teacher via **Campus Session** and copy the token to `teacherAccessToken` (do not overwrite the director `campusAccessToken`)

Import the environment first so `{{baseUrl}}`, hosts, and tokens resolve. Each collection is importable on its own, but tokens and hosts live in the shared environment.

## Collections

| File | Covers | Status |
|---|---|---|
| `collections/Health.postman_collection.json` | `GET /health` | Batch 1 — documented |
| `collections/Admin-Session.postman_collection.json` | `GET\|POST\|DELETE /admin/session` | Batch 1 — documented |
| `collections/School-Accounts.postman_collection.json` | `GET\|POST\|DELETE /school-accounts/session`, `POST /school-accounts/password`, `GET\|POST /school-accounts/username` | Batches 2–3 — documented |
| `collections/Campus-Session.postman_collection.json` | `GET\|POST\|DELETE /school-accounts/campus-session` | Batches 3–4 — documented |
| `collections/Public.postman_collection.json` | `GET /public/featured-schools`, `GET /public/resolve`, `POST /public/contact` | Batch 4 — documented |
| `collections/Admin-Contact-Messages.postman_collection.json` | `GET /admin/contact-messages`, `POST /admin/contact-messages/:id/act` | Batch 5 — documented |
| `collections/Admin-Featured-Schools.postman_collection.json` | `GET\|POST /admin/featured-schools`, `PATCH\|DELETE /admin/featured-schools/:id` | Batches 5–6 — documented |
| `collections/Admin-Tenants.postman_collection.json` | `GET\|POST /admin/tenants`, `GET /admin/tenants/username`, `POST /admin/tenants/:id/reactivate`, `POST /admin/tenants/:id/resend-credentials`, `POST /admin/tenants/:id/suspend` | Batches 6–7 — documented |
| `collections/School-Teachers.postman_collection.json` | `GET\|POST /school-teachers`, `POST /school-teachers/password`, `POST /school-teachers/:id/resend-credentials` | Batch 8 — documented |
| `collections/Admin-Dashboard.postman_collection.json` | `GET /admin/dashboard` | Last backend route — documented |

Import the **environment first**, then each file under `collections/`. The import list is **complete**: every live backend method+path in `create-app.ts` has a split collection. Batch 7 coverage: admin username lookup, reactivate, resend-credentials, and suspend — appended to Admin-Tenants only. School-account username stays in School-Accounts. Batch 8 coverage: school-teacher roster, create, password, and resend — **School-Teachers only**. Dashboard is **Admin-Dashboard only** (not Admin-Tenants).

## Conventions

- `{{baseUrl}}` is the backend, not the Next app (`3000`).
- Tenant routing uses the `x-school-host` header (checked before `Host`). Matching strips `:{port}` and lowercases. Local root is `e-school.et`.
- Platform admin Bearer token: `{{accessToken}}`. School first-login: `{{schoolAccessToken}}`. Campus director: `{{campusAccessToken}}`. Campus teacher: `{{teacherAccessToken}}`. Tokens are HMAC (`payload.signature`), not JWT. Admin tokens will not verify on school/campus routes. School and campus share `:school-account-session`.
- School-account routes (session, password, username) require `x-school-host: {{appHost}}`. Error: `School accounts are only allowed on the app host`.
- Campus routes require `{{schoolHost}}`. Error: `Campus login is only allowed on that school's host`. Do not reuse the app-host 403 text.
- School-teacher routes are campus routes. **Host is checked before the token** (unlike `/admin/*`). Missing token on the app host is **403**, not 401. List / create / resend need director `{{campusAccessToken}}`. Password needs teacher `{{teacherAccessToken}}`. Inactive / suspended / `pending_setup` → `This school account is not active` (not the school-account suspended string).
- Campus `DELETE /school-accounts/campus-session` only forwards **403** (non-campus host). Missing token, invalid token, and **suspended** still return `200 { "ok": true }`. School DELETE also 403s when suspended — do not copy that.
- Public featured-schools and contact ignore host and auth. Contact success is **201** `{ "ok": true }` (no message id). Copy `{{contactMessageId}}` from `GET /admin/contact-messages`. `GET /public/resolve` uses `x-school-host` and always returns 200 (`unknown` / `apex`, never 404).
- Admin inbox / featured schools / tenants / dashboard require `{{accessToken}}` **then** `{{adminHost}}`. Session is checked first: missing/invalid token is **401** `{ "error": "Unauthorized" }` even on a school host. Wrong host after a valid admin token is **403** `{ "error": "This action is only allowed on the admin host" }` (not the admin-login 403 text). On dashboard, method is checked after session and **before** host — POST with a valid token on a school host is **405**, not 403. Tenant list pagination is **not** the contact inbox (default pageSize **10**, max **50**). Dashboard has no query params. `newest` is capped at 3 and is not the tenant list.
- Error bodies are `{ "error": "<string>" }` except `GET /health`. Missing JSON fields become `""`, not 400. No 422.
- Do not invent status codes or routes. Read handlers, tests, and use cases.

## Shared environment variables

File: `environments/School-API.local.postman_environment.json`

Leave secrets empty in git. Do not copy values from `backend/.env`.

| Variable | Purpose |
|---|---|
| `baseUrl` | Backend origin (`http://127.0.0.1:5000`) |
| `rootHost` | `e-school.et` |
| `adminHost` | `admin.e-school.et:3000` |
| `appHost` | `app.e-school.et:3000` |
| `apexHost` | `e-school.et:3000` |
| `schoolHost` | `{slug}.e-school.et:3000` (example `north-ridge.e-school.et:3000`) |
| `adminEmail` | Platform admin email |
| `adminPassword` | Secret — leave empty in git |
| `accessToken` | HMAC admin session from POST `/admin/session` |
| `schoolEmail` | Director email on the app host (example `head@north-hall.et`) |
| `schoolPassword` | Secret — temporary or current school-account password |
| `schoolAccessToken` | HMAC school session from POST `/school-accounts/session` |
| `schoolAccountId` | Tenant id from the sign-in body (`accountId`) |
| `schoolUsername` | Slug to look up / claim (example `north-ridge`) |
| `campusAccessToken` | HMAC campus session from POST `/school-accounts/campus-session` |
| `featuredSchoolId` | Featured-school id. `GET /public/featured-schools` writes the first **published** `id` on 200. `POST /admin/featured-schools` overwrites it from `school.id` on 201 |
| `tenantId` | Tenant id. `GET /admin/tenants` writes the first row `id` on 200 when the list is non-empty. `POST /admin/tenants` overwrites it from `school.id` on 201 |
| `contactMessageId` | Contact-message id. `GET /admin/contact-messages` writes the first row `id` on 200 when the list is non-empty. Public `POST /public/contact` does not return an id |
| `teacherId` | Teacher id. `GET /school-teachers` writes the first row `id` on 200 when the list is non-empty. `POST /school-teachers` overwrites it from `teacher.id` on 201 |
| `teacherEmail` | Teacher email (example `abebe@north-hall.et`). Create overwrites it from `teacher.email` on 201 |
| `teacherPassword` | Secret — temporary teacher password from create/resend. Leave empty in git |
| `teacherAccessToken` | HMAC campus session (`kind: "teacher"`) from POST `/school-accounts/campus-session`. Do not overwrite director `campusAccessToken` |

## Out of scope

- Frontend Next server actions / `BACKEND_URL` fetch wrappers are not Postman collections. There is no `app/api` BFF router. Next also exposes its own `GET /health`, `GET /public/featured-schools`, and `GET /public/resolve` (`src/app/**/route.ts`) on port 3000 — those are not backend routes.
- Do not recreate `School-API.postman_collection.json`
