# Platform-admin dashboard stats

O(1) dashboard numbers from a single-row table, kept in the same transaction as tenant writes.

## Serving

`servingPercent = total === 0 ? 0 : Math.round((active / total) * 100)`.

Counts are stored. Percent is derived on read. Never persisted.

## Table

`platform.dashboard_stats`, exactly one row, `id = 1`.

- `school_count`, `active_count`, `pending_setup_count`, `suspended_count`
- `created_by_year` JSON map (`{"2026": 4}`)
- `newest` JSON: latest 3 `{id, name, slug, email, status, created}`
- `updated_at`

Created in `ensureSchema()` (no migrations folder). If the row is missing, one-time `COUNT` / `GROUP BY` / newest-3 from `platform.tenants`, then insert. Later dashboard reads select this row only.

## Write path

Stats update inside the tenant store, same transaction as the tenant change:

| Mutation | Counters | Snapshots |
|---|---|---|
| `insertPending` | school++, pending++, year++ | prepend newest (cap 3) |
| `insert` (legacy active) | school++, active++, year++ | prepend newest (cap 3) |
| `claimSlug` | pending--, active++ | patch that school in newest |
| `setStatus` | decrement old bucket, increment new | patch newest status if present |

## API

`GET /admin/dashboard` — platform-admin session + admin host.

Use case `GetAdminDashboard` reads the stats row and adds `servingPercent`.
