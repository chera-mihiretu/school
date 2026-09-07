# Frontend stores

Zustand is the client state layer for the Next app. It is not domain and not the backend.

Server Components still load first paint (SEO, Host resolution, featured list fetch). After that, Client Components read and update Zustand.

## Stores

| Store | Used by |
|---|---|
| `useFeaturedSchoolsStore` | Network home directory, admin Featured page |
| `useConsoleStore` | Dashboard, create school, console shell, list flash |
| `useSchoolsListStore` | Schools list filters, sort, confirm dialog, resend pending/done dialog with credentials |
| `useCreateSchoolStore` | Create-school draft (name, email), `schoolId` on reveal, resend, one-time credentials |
| `useFirstLoginStore` | School-director first login (email, passwords, username/slug, finding, availability, session, `nextStep`). `clearSecrets()` on leave of the first-login tree; not a full `reset()`. |
| `useCampusLoginStore` | Campus-host sign-in after username claim, plus teacher password-change fields. `reset()` on unmount. |
| `useCampusDashboardStore` | Director campus shell drawer (mobile nav). `reset()` on campus sign-out. |
| `useTeachersStore` | Director `/teachers` roster and `/teachers/new` create draft, one-time credentials reveal. `resetDraft()` on leave of create. `reset()` on campus sign-out. |
| `useStaffStore` | Director `/staff` roster and `/staff/new` create draft, one-time credentials reveal. `resetDraft()` on leave of create. `reset()` on campus sign-out. |
| `useContactStore` | Landing contact form (sentTo, error, pending) |
| `useContactInboxStore` | Admin inbox selected message / act-on dialog |
| `createAppStore` | Typed `create<T>()` helper |

Left out of Zustand on purpose: theme bootstrap (`theme-provider`), the mark film clock, and platform-admin login `useActionState`. School first-login uses `useFirstLoginStore`. Campus login uses `useCampusLoginStore`.

## Rules

- One file per feature: `<feature>-store.ts`, `"use client"`.
- Build with `createAppStore<State>(...)`.
- Imports at the top of the file.
- No Postgres, Awilix, Pino, or `BACKEND_URL` in a store. Browser `fetch` uses a relative Next path.
- Re-export hooks from `index.ts`.
- Call hooks only from Client Components.

See `documents/zustand.md`.
