# Zustand (frontend UI state)

Living document. Update when the store pattern or conventions change.  
Started: 2026-09-06  
Last updated: 2026-09-07 (campus login identifier)

Zustand is the client state layer for the Next frontend. It is **not** domain, **not** a use-case layer, and **not** a database client.

---

## Where it lives

```text
frontend/src/stores/
  index.ts
  create-store.ts
  featured-schools-store.ts   homepage directory + admin Featured
  console-store.ts            dashboard events, flash, drawer
  schools-list-store.ts       list filters / confirm (current API page)
  create-school-store.ts      create-school draft + one-time credential reveal
  first-login-store.ts        school-director first login (not the operator reveal)
  campus-login-store.ts       campus-host sign-in + teacher password-change fields
  campus-dashboard-store.ts   director campus shell mobile drawer
  teachers-store.ts           director campus teacher roster / create / resend
  staff-store.ts              director campus staff roster / create / resend
  contact-store.ts            landing contact success / error
  contact-inbox-store.ts      admin inbox Act on dialog
  README.md
```

Package: **zustand** in `frontend/package.json`. Install and lock from `frontend/`.

Existing screens render through these stores. Theme tokens stay in `theme-provider`. The mark film keeps its own animation clock. Login keeps `useActionState` for the server action.

---

## Clean Architecture

```text
Client Components  →  stores (UI state + fetched view data)
Server Components / server actions  →  backend via BACKEND_URL
backend domain / application  →  Postgres (never the store)
```

| Layer | May | Must not |
|---|---|---|
| `frontend/src/stores` | Hold lists, status, errors, setters; `fetch` a Next path | Import Postgres, Awilix, Pino, backend ports, or domain use cases |
| Server Components | Load first paint; call `BACKEND_URL` | Subscribe to Zustand |
| Backend | Own business rules and persistence | Know about Zustand |

---

## When to use Zustand vs Server Components

Server Components are the default. Render on the server when the page can be complete without client interaction.

Use a Zustand store when:

- Several Client Components share the same list or status
- The UI refetches or updates after mount (load more, filter, retry)
- Selection, drawers, or wizard step state would otherwise be prop-drilled

Do **not** add a store to prefetch data that a Server Component already has, or to hide a business rule that belongs on the backend.

---

## Conventions

- One file per feature store: `<feature>-store.ts`.
- `"use client"` on every store that exports a hook.
- Build stores with `createAppStore<State>(...)` from `create-store.ts` (typed `create<T>()`, no inline imports).
- Imports stay at the top of the module.
- State is data + UI status only. Example shape:

```ts
{
  schools: FeaturedSchool[];
  status: "idle" | "loading" | "error";
  error: string | null;
  setSchools: (schools: FeaturedSchool[]) => void;
  setStatus: (status: FeaturedSchoolsStatus) => void;
  loadPublic: () => Promise<void>;
}
```

- Fetch from the **Next origin** (relative path). The browser does not call `BACKEND_URL`. Keep the path in an exported constant so a later UI change can retarget it.
- If the Next route or the backend behind it is unreachable, set `status: "error"`. Do not retry with a second URL inside the store.
- Re-export hooks and public types from `frontend/src/stores/index.ts`.
- Import stores only from Client Components (`"use client"`).

---

## Featured schools

`useFeaturedSchoolsStore` is the directory store. The home Server Component still GETs `GET /public/featured-schools` for first paint, then `ApexView` hydrates the store and reads it. The admin Featured page uses the same store for the list and the add/unpublish draft.

| Member | Role |
|---|---|
| `schools` | Last successful public list |
| `hydrated` | True after a server seed or `loadPublic` |
| `status` | `idle` / `loading` / `error` |
| `error` | Message when `status` is `error`; otherwise `null` |
| `hydrate` / `setSchools` | Seed or replace the list |
| `loadPublic` | `GET` `FEATURED_SCHOOLS_PATH` (`/public/featured-schools`) |
| `draftName` / `draftSlug` / `flash` / `removingId` | Admin Featured form |

`loadPublic` treats a failed HTTP response or a thrown `fetch` as backend-unreachable UI state. Parsing accepts either a `FeaturedSchool[]` or `{ schools: FeaturedSchool[] }`.

---

## How another feature adds a store

1. Add `frontend/src/stores/<feature>-store.ts` with a state type and `createAppStore`.
2. Export the hook and types from `index.ts`.
3. Call the hook from Client Components in `frontend/src/features/<name>/`.
4. Keep mutations that change tenants, sessions, or money on the server (actions / backend). The store only reflects what the UI needs to show.

Do not copy this pattern into `backend/`. Do not add `zustand` to the backend package.

---

## Campus teachers

**`useCampusLoginStore`** (`campus-login-store.ts`) is the campus `/login` store. The sign-in field is `identifier` (email or school ID), not an email-only input. `CampusSessionView` includes `kind: "director" | "teacher" | "staff"` and `mustChangePassword`. Teacher and staff password-change fields live on this store (same pattern as `useFirstLoginStore`).

**`useTeachersStore`** (`teachers-store.ts`) is the director `/teachers` list and `/teachers/new` create page: teacher list, create draft (Ethiopian names, sex, phone, email), pending, error, one-time credentials reveal (includes school ID when present), resend. Mirror the operator reveal honesty (`emailSent`, `emailError`, plaintext password only on create/resend). `resetDraft()` when leaving `/teachers/new`. `reset()` on campus sign-out (not when leaving `/teachers` for `/dashboard`). The draft does **not** include `employeeId`.

**`useStaffStore`** (`staff-store.ts`) is the director `/staff` list and `/staff/new` create page: staff list, create draft (Ethiopian names, sex, phone, email), pending, error, one-time credentials reveal (includes school ID), resend. `resetDraft()` when leaving `/staff/new`. `reset()` on campus sign-out.

**`useCampusDashboardStore`** (`campus-dashboard-store.ts`) holds the director shell mobile drawer. Do **not** put teacher or staff list or session `kind` here.

Do **not** put teacher create in `useCreateSchoolStore` or the first-login wizard. Teachers never use `app.<root>`.

See `teachers.md` and `staff.md`.

---

## Change log

| Date | Change |
|---|---|
| 2026-09-07 | `useStaffStore` holds the director `/staff` roster and `/staff/new` create draft. `resetDraft()` on leave of create. `reset()` on campus sign-out. Campus session `kind` includes `"staff"`. |
| 2026-09-07 | `useCampusLoginStore` sign-in field is `identifier` (email or school ID). Teacher credentials reveal includes `schoolId`. |
| 2026-09-07 | Director `/teachers` list and `/teachers/new` create, matching admin Schools / Create. `useTeachersStore.resetDraft()` on leave of the create page. |
| 2026-09-07 | `useFirstLoginStore.nextStep` includes `"abbreviation"` (step 3 of first-login). `useTeachersStore` create draft no longer holds an employee id. |
| 2026-09-07 | `useCampusDashboardStore` holds the director campus sidebar drawer. `useTeachersStore` is `/teachers` only; reset on sign-out. |
| 2026-09-07 | `useTeachersStore` holds the director campus teacher list, Ethiopian-name create draft, and one-time credentials reveal. `useCampusLoginStore` holds teacher password-change fields and campus session `kind` / `mustChangePassword`. |
| 2026-09-06 | `useFirstLoginStore.clearSecrets()` wipes password fields when leaving the first-login tree. It does not call `reset()` (that would drop `session` / `nextStep` / slug shared with the username step). `useCampusLoginStore.reset()` runs on campus login unmount. |
| 2026-09-06 | `useFirstLoginStore` also holds slug, finding, availability, and the permanence confirmation for the username step. `useCampusLoginStore` is campus-host sign-in only. Still separate from `useCreateSchoolStore`. |
| 2026-09-06 | `useFirstLoginStore` holds email, password fields, pending, error, session view, and `nextStep` (`password` \| `username`) for `app` first-login. Separate from `useCreateSchoolStore`. |
| 2026-09-06 | Contact store holds `sentTo`, `error`, and `pending` after the landing form posts to `/public/contact`. |
| 2026-09-06 | `useCreateSchoolStore` holds name, email, pending, error, and a one-time `credentials` reveal (`password` + `firstLoginUrl`). `reset()` clears the password on leave. No slug. |
| 2026-09-06 | Client screens read Zustand: featured directory, console tenants, schools list UI, create-school draft, contact form. |
| 2026-09-06 | Zustand installed in `frontend/`. Typed `createAppStore` helper. |
