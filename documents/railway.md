# Railway

Living document. Update when production hosting, public hosts, or Railway service wiring changes.  
Started: 2026-09-07  
Last updated: 2026-09-07 (first Railway deploy)

Local Docker stays in `docker-compose.yml`. Railway is production HTTPS on `e-school.et`. Do not add `railway.json` / `railway.toml` — Config as Code is deprecated for new services ([Railway docs](https://docs.railway.com/config-as-code)). Set build and deploy in the dashboard.

Repo: `https://github.com/chera-mihiretu/school.git`. Each push to `main` should rebuild only the service whose watch path changed.

---

## What to create

One Railway project, three pieces:

| Canvas name | Source | Public? |
|---|---|---|
| `Postgres` | Database → PostgreSQL | no |
| `backend` | same GitHub repo, root `/backend` | **no** (private network only) |
| `frontend` | same GitHub repo, root `/frontend` | yes — apex + wildcard |

Name the API service **`backend`** so `${{backend.RAILWAY_PRIVATE_DOMAIN}}` and `backend.railway.internal` match.

---

## Backend service

Settings:

- **Source** → GitHub repo `chera-mihiretu/school`, branch `main`
- **Root Directory** `/backend`
- **Builder** Dockerfile (`backend/Dockerfile`)
- **Watch Paths** `/backend/**`
- **Pre-deploy Command** `node src/seed-platform-admin.ts`  
  Idempotent. Creates `platform.admins` if empty. Failures abort the release.
- **Healthcheck Path** `/health`
- Do **not** generate a public domain. Do **not** set `PORT` (Railway injects it).

Variables:

| Key | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (or `${{Postgres.DATABASE_PRIVATE_URL}}` to stay on the private network) |
| `DATABASE_SSL` | `require` if the URL has no `sslmode` |
| `APP_PROTOCOL` | `https` |
| `APP_HOST` | `e-school.et` |
| `PLATFORM_ADMIN_EMAIL` | operator email |
| `PLATFORM_ADMIN_PASSWORD` | first-admin bootstrap only; ignored after the first seed |
| `SESSION_SECRET` | 32+ random characters (`openssl rand -base64 32`) |
| `NODE_ENV` | `production` |

Optional SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`). Missing SMTP still returns 201 with plaintext credentials for the operator reveal.

---

## Frontend service

Settings:

- **Root Directory** `/frontend`
- **Builder** Dockerfile (`frontend/Dockerfile`)
- **Watch Paths** `/frontend/**`
- **Healthcheck Path** `/health`
- **Generate Domain** only as a temporary check. Production traffic is the custom hosts below.

Variables:

| Key | Value |
|---|---|
| `APP_PROTOCOL` | `https` |
| `APP_HOST` | `e-school.et` |
| `BACKEND_URL` | `http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:${{backend.PORT}}` |
| `NODE_ENV` | `production` |

`BACKEND_URL` is server-side only. Browsers never talk to the API service.

---

## Custom domains (required)

Host is tenancy. A single `*.up.railway.app` hostname cannot serve `admin`, `app`, and `{slug}`.

On the **frontend** service, add:

1. Apex `e-school.et`
2. Wildcard `*.e-school.et` (covers `admin`, `app`, `www`, and campus slugs)

Follow Railway’s DNS panel: CNAME to the assigned `*.up.railway.app`, plus the wildcard `_acme-challenge` CNAME and ownership TXT. Do not proxy the `_acme-challenge` record (Cloudflare grey-cloud). See [Working with domains](https://docs.railway.com/networking/domains/working-with-domains).

`APP_HOST=e-school.et` with `APP_PROTOCOL=https` must **not** grow a `:3000` suffix. That is local HTTP only.

---

## Public URLs

| Host | Use |
|---|---|
| `https://e-school.et` | network home |
| `https://admin.e-school.et` | platform operator |
| `https://app.e-school.et` | director first login |
| `https://{slug}.e-school.et` | campus |

---

## First deploy order

1. Add Postgres. Wait until it is healthy.
2. Add `backend`, set variables, deploy. Confirm logs: `backend listening`, `database reachable`, seed `created` or `skipped`.
3. Add `frontend`, set variables, deploy. Confirm `/health`.
4. Attach custom domains. Open `https://admin.e-school.et` and sign in with the seeded operator.

Local `./deploy.sh` is unchanged (`http://e-school.et:3000`).
